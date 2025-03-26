import { SeismicFenceData_api } from "@api";

import { PolylineWithSectionLengths } from "./intersectionPolylineTypes";

import { b64DecodeFloatArrayToFloat32 } from "../base64";

/**
 * The transformed fence data, with the fence traces decoded as a Float32Array.
 *
 * Remove the base64 encoded data and replace with a Float32Array
 */
export type SeismicFenceData_trans = Omit<SeismicFenceData_api, "fence_traces_b64arr"> & {
    fenceTracesFloat32Arr: Float32Array;
};

/**
 * Seismic polyline and transformed fence data.
 *
 * The data contains both the source polyline, and the requested fence polyline
 * with its corresponding fence data.
 *
 * sourcePolyline: The source polyline with section lengths.
 * fencePolylineUtmXy: The fence polyline XY coordinates, i.e. a resampled version of the sourcePolyline.polylineUtmXy.
 * fenceData: The transformed fence data, with the fence traces decoded as a Float32Array.
 */
export type SeismicPolylineAndFenceData = {
    sourcePolyline: PolylineWithSectionLengths; // TODO: Move to storedData for layer
    fencePolylineUtmXy: number[]; // TODO: Move to storedData for layer
    fenceData: SeismicFenceData_trans;
};

/**
 * Assemble seismic polyline and transformed fence data.
 *
 * The transformed fence data is decoded from base64 to a Float32Array.
 */
export function createSeismicPolylineAndTransformedFenceData(
    sourcePolyline: PolylineWithSectionLengths,
    fencePolylineUtmXy: number[],
    fenceApiData: SeismicFenceData_api
): SeismicPolylineAndFenceData {
    const { fence_traces_b64arr, ...untransformedData } = fenceApiData;

    const dataFloat32Arr = b64DecodeFloatArrayToFloat32(fence_traces_b64arr);

    return {
        sourcePolyline: sourcePolyline,
        fencePolylineUtmXy: fencePolylineUtmXy,
        fenceData: {
            ...untransformedData,
            fenceTracesFloat32Arr: dataFloat32Arr,
        },
    };
}
