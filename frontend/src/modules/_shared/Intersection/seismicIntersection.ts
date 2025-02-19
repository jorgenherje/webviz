import { SeismicFenceData_api, SeismicFencePolyline_api } from "@api";

import { b64DecodeFloatArrayToFloat32 } from "../base64";

// Remove the base64 encoded data and replace with a Float32Array
export type SeismicFenceData_trans = Omit<SeismicFenceData_api, "fence_traces_b64arr"> & {
    fenceTracesFloat32Arr: Float32Array;
};

export type SeismicPolylineAndFenceData = {
    polyline: SeismicFencePolyline_api;
    fenceData: SeismicFenceData_trans;
};

export function createTransformedSeismicPolylineAndFenceData(
    polyline: SeismicFencePolyline_api,
    apiData: SeismicFenceData_api
): SeismicPolylineAndFenceData {
    const { fence_traces_b64arr, ...untransformedData } = apiData;

    const dataFloat32Arr = b64DecodeFloatArrayToFloat32(fence_traces_b64arr);

    return {
        polyline,
        fenceData: {
            ...untransformedData,
            fenceTracesFloat32Arr: dataFloat32Arr,
        },
    };
}
