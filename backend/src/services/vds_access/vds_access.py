import logging
from typing import List, Optional, Tuple
import json

import numpy as np
from numpy.typing import NDArray
from requests_toolbelt.multipart.decoder import MultipartDecoder, BodyPart
import httpx

from src import config

import xtgeo

from .response_types import VdsAttributeMetadata, VdsFenceMetadata, VdsMetadata
from .request_types import (
    VdsCalculateSurfaceAttributes,
    VdsCoordinates,
    VdsCoordinateSystem,
    VdsInterpolation,
    VdsFenceRequest,
    VdsRequestedResource,
    VdsMetadataRequest,
    VdsSurface,
    VdsCalculateAttributesAlongHorizonRequest,
)


LOGGER = logging.getLogger(__name__)


def bytes_to_ndarray_float32(bytes_data: bytes, shape: List[int]) -> NDArray[np.float32]:
    """
    Convert bytes to numpy ndarray with row-major order, i.e. "C" order
    """
    return np.ndarray(shape=shape, dtype="<f4", buffer=bytes_data, order="C")


def bytes_to_flatten_ndarray_float32(bytes_data: bytes, shape: List[int]) -> NDArray[np.float32]:
    """
    Convert bytes to numpy flatten ndarray with row-major order, i.e. "C" order
    """
    return bytes_to_ndarray_float32(bytes_data, shape).flatten(order="C")


class VdsAccess:
    """Access to the service hosting vds-slice.
    https://github.com/equinor/vds-slice

    This access class is used to query the service for slices and fences of seismic data stored in Sumo in vds format.
    Note that we are not providing the service with the actual vds file, but rather a SAS token and an URL to the vds file.
    """

    def __init__(
        self, sas_token: str, vds_url: str, interpolation_method: VdsInterpolation = VdsInterpolation.LINEAR
    ) -> None:
        self.sas = sas_token
        self.vds_url = vds_url
        self._interpolation = interpolation_method

    @staticmethod
    async def _query_async(endpoint: str, request: VdsRequestedResource) -> httpx.Response:
        """Query the service"""

        async with httpx.AsyncClient() as client:
            tmp = request.request_parameters()
            response = await client.post(
                f"{config.VDS_HOST_ADDRESS}/{endpoint}",
                headers={"Content-Type": "application/json"},
                content=json.dumps(tmp),
                timeout=60,
            )

        if response.is_error:
            raise RuntimeError(f"({str(response.status_code)})-{response.reason_phrase}-{response.text}")

        return response

    async def get_metadata_async(self) -> VdsMetadata:
        """Gets metadata from the cube"""
        endpoint = "metadata"

        metadata_request = VdsMetadataRequest(vds=self.vds_url, sas=self.sas)
        response = await self._query_async(endpoint, metadata_request)

        metadata = response.json()
        return VdsMetadata(**metadata)

    async def get_calculated_attributes_along_surface_async(
        self,
        xtgeo_surface: xtgeo.RegularSurface,
        calculate_attributes: List[VdsCalculateSurfaceAttributes],
        above: int,
        below: int,
        vertical_seismic_bounds: Optional[Tuple[float, float]] = None,
    ) -> Tuple[List[NDArray[np.float32]], int, int]:
        """Get calculated attributes along a horizon

        Provided surface values are ensured to be within the vertical seismic bounds of the seismic cube. If the surface depth values including
        above/below are outside the seismic cube, the values are set to the fill value.

        `vds-slice`: As samples that are out-of-range of the seismic volume in the vertical plane are considered an error. Samples that are out-of-range
        of the seismic volume in the horizontal plane will be set to fillValue in the resulting attribute(s).

        NOTE: The filled values handles vertical bound, including above and below, and a minimum of 2 sample steps (due to interpolation)

        `Returns:`
        `Tuple[flattened_calculated_attribute_surface_float32_arrays: List[NDArray[np.float32]], num_x_samples: int, num_y_samples: int]`

        `flattened_calculated_attribute_surface_float32_arrays`: List of 1D np.ndarray with dtype=float32, row by row. Where row is x-direction (?). One 1D np.ndarray per requested attribute`.\n
        `num_x_samples`: Number of surface values in local x-direction.\n
        `num_y_samples`: Number of surface values in local y-direction.\n

        NOTE: Improve name of num_local_x and num_local_y?
        """

        endpoint = "attributes/surface/along"

        # Expect xtgeo_surface.values to defined
        if not np.ma.isMaskedArray(xtgeo_surface.values):
            raise ValueError("Surface values are not a masked array.")

        # Samples that are out-of-range of the seismic volume in the vertical plane are
        # considered an error. Set to fill value to avoid error.
        hard_coded_fill_value = -999.25

        hard_coded_bound_margin = 5  # 2*survey.sample_step (due to vds-slice interpolation algorithm)

        hard_coded_step_size = 1

        filled_surface_values: np.ma.MaskedArray = np.ma.filled(xtgeo_surface.values, hard_coded_fill_value)
        if vertical_seismic_bounds is not None:
            filled_surface_values[
                filled_surface_values < (vertical_seismic_bounds[0] + below + hard_coded_bound_margin)
            ] = hard_coded_fill_value
            filled_surface_values[
                filled_surface_values > (vertical_seismic_bounds[1] - above - hard_coded_bound_margin)
            ] = hard_coded_fill_value

        vds_surface = VdsSurface(
            fill_value=hard_coded_fill_value,
            rotation=xtgeo_surface.rotation,
            values=filled_surface_values.tolist(),
            xinc=xtgeo_surface.xinc,
            yinc=xtgeo_surface.yinc,
            xori=xtgeo_surface.xori,
            yori=xtgeo_surface.yori,
        )

        calculate_attributes_along_horizon_request = VdsCalculateAttributesAlongHorizonRequest(
            vds=self.vds_url,
            sas=self.sas,
            above=above,
            attributes=calculate_attributes,
            below=below,
            interpolation=self._interpolation,
            step_size=hard_coded_step_size,
            surface=vds_surface,
        )

        response = await self._query_async(endpoint, calculate_attributes_along_horizon_request)

        # Use MultipartDecoder with httpx's Response content and headers
        decoder = MultipartDecoder(content=response.content, content_type=response.headers["Content-Type"])
        parts = decoder.parts

        # Part 0: metadata
        metadata = VdsAttributeMetadata(**json.loads(parts[0].content))
        num_x_samples = metadata.shape[0]  # TODO: Improve name?
        num_y_samples = metadata.shape[1]  # TODO: Improve name?

        if metadata.format != "<f4":
            raise ValueError(f"Expected float32, got {metadata.format}")
        if len(metadata.shape) != 2:
            raise ValueError(f"Expected shape to be 2D, got {metadata.shape}")

        # Part 1 ... n-1: attribute values
        flattened_calculated_attribute_surface_float32_arrays: List[NDArray[np.float32]] = []
        for part in parts[1:]:
            byte_array = part.content

            # Flattened array with row major order, i.e. C-order in numpy
            flattened_calculated_attribute_surface_float32_array = bytes_to_flatten_ndarray_float32(
                byte_array, shape=metadata.shape
            )

            # Convert every value of `hard_coded_fill_value` to np.nan
            flattened_calculated_attribute_surface_float32_array[
                flattened_calculated_attribute_surface_float32_array == hard_coded_fill_value
            ] = np.nan

            flattened_calculated_attribute_surface_float32_arrays.append(
                flattened_calculated_attribute_surface_float32_array
            )

        return (flattened_calculated_attribute_surface_float32_arrays, num_x_samples, num_y_samples)

    async def get_flattened_fence_traces_array_and_metadata_async(
        self, coordinates: VdsCoordinates, coordinate_system: VdsCoordinateSystem = VdsCoordinateSystem.CDP
    ) -> Tuple[NDArray[np.float32], int, int]:
        """
        Gets traces along an arbitrary path of (x, y) coordinates, with a trace per coordinate.

        The traces are perpendicular on the on the coordinates in the x-y plane, and each trace has number
        of samples equal to the depth of the seismic cube.

        With traces perpendicular to the x-y plane, the traces are defined to go along the depth direction
        of the fence.

        Invalid values, e.g. values for points outside of the seismic cube, are set to np.nan.

        `Returns:`
        `Tuple[flattened_fence_traces_array: NDArray[np.float32], num_traces: int, num_samples_per_trace: int]`

        `flattened_fence_traces_array`: 1D np.ndarray with dtype=float32, stored trace by trace. The array has length `num_traces x num_samples_per_trace`.\n
        `num_traces`: number of traces along the length of the fence, i.e. number of (x, y) coordinates.\n
        `num_samples_per_trace`: number of samples in each trace, i.e. number of values along the height/depth axis of the fence.\n


        \n`Description:`

        With `m = num_traces`, and `n = num_samples_per_trace`, the flattened array has length `mxn`.

        `2D Fence Trace Array from VDS-slice query:`

        ```
        [[t11, t12, ..., t1n],
        [t21, t22, ..., t2n],
                ...          ,
        [tm1, tm2, ..., tmn]]
        ```

        \n`Returned flattened 2D trace array with row major order:`

        ```
        [t11, t12, ..., t1n, t21, t22, ..., t2n, ..., tm1, tm2, ..., tmn]
        ```

        \n`Visualization Example:`

        ```
        trace_1  trace_2     trace_m
        |--------|--- ... ---| sample_1
        |--------|--- ... ---| sample_2
                     .
                     .
                     .
        |--------|--- ... ---| sample_n-1
        |--------|--- ... ---| sample_n
        ```
        """

        endpoint = "fence"

        # Temporary hard coded fill value for points outside of the seismic cube.
        # If no fill value is provided in the request is rejected with error if list of coordinates
        # contain points outside of the seismic cube.
        hard_coded_fill_value = -999.25

        fence_request = VdsFenceRequest(
            vds=self.vds_url,
            sas=self.sas,
            coordinate_system=coordinate_system,
            coordinates=coordinates,
            interpolation=self._interpolation,
            fill_value=hard_coded_fill_value,
        )

        # Fence query returns two parts - metadata and data
        response = await self._query_async(endpoint, fence_request)

        # Use MultipartDecoder with httpx's Response content and headers
        decoder = MultipartDecoder(content=response.content, content_type=response.headers["Content-Type"])
        parts = decoder.parts

        # Validate parts from decoded response
        if len(parts) != 2 or not parts[0].content or not parts[1].content:
            raise ValueError(f"Expected two parts, got {len(parts)}")

        # Expect each part in parts tuple to be BodyPart
        if not isinstance(parts[0], BodyPart) or not isinstance(parts[1], BodyPart):
            raise ValueError(f"Expected parts to be BodyPart, got {type(parts[0])}, {type(parts[1])}")

        metadata = VdsFenceMetadata(**json.loads(parts[0].content))
        byte_array = parts[1].content

        if metadata.format != "<f4":
            raise ValueError(f"Expected float32, got {metadata.format}")

        if len(metadata.shape) != 2:
            raise ValueError(f"Expected shape to be 2D, got {metadata.shape}")

        # fence array data: [[t11, t12, ..., t1n], [t21, t22, ..., t2n], ..., [tm1, tm2, ..., tmn]]
        # m = num_traces, n = num_samples_per_trace
        num_traces = metadata.shape[0]
        num_samples_per_trace = metadata.shape[1]

        # Flattened array with row major order, i.e. C-order in numpy
        flattened_fence_traces_float32_array = bytes_to_flatten_ndarray_float32(byte_array, shape=metadata.shape)

        # Convert every value of `hard_coded_fill_value` to np.nan
        flattened_fence_traces_float32_array[flattened_fence_traces_float32_array == hard_coded_fill_value] = np.nan

        return (flattened_fence_traces_float32_array, num_traces, num_samples_per_trace)
