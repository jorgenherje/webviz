import { SeismicFenceData_api } from "@api";

import { b64DecodeFloatArrayToFloat32 } from "../base64";

// Remove the base64 encoded data and replace with a Float32Array
export type SeismicFenceData_trans = Omit<SeismicFenceData_api, "fence_traces_b64arr"> & {
    fenceTracesFloat32Arr: Float32Array;
};

export type SeismicPolylineAndFenceData = {
    sourcePolyline: SeismicFencePolyline;
    fencePolylineUtmXy: number[];
    fenceData: SeismicFenceData_trans;
};

export type SeismicFencePolyline = {
    polylineUtmXy: number[];
    actualSectionLengths: number[];
};

/**
 * Assemble seismic polyline and transformed fence data.
 *
 * The transformed fence data is decoded from base64 to a Float32Array.
 */
export function createTransformedSeismicPolylineAndFenceData(
    sourcePolyline: SeismicFencePolyline,
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
