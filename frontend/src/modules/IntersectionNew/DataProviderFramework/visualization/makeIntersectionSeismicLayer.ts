import type { IntersectionReferenceSystem } from "@equinor/esv-intersection";
import { point2Distance } from "@lib/utils/vec2";
import type {
    IntersectionRealizationSeismicData,
    IntersectionRealizationSeismicSettings,
} from "@modules/_shared/DataProviderFramework/dataProviders/implementations/IntersectionRealizationSeismicProvider";
import { Setting } from "@modules/_shared/DataProviderFramework/settings/settingsDefinitions";
import type {
    EsvLayerItemsMaker,
    TransformerArgs,
} from "@modules/_shared/DataProviderFramework/visualization/VisualizationAssembler";
import { LayerType } from "@modules/_shared/components/EsvIntersection";

/**
 * Make a trajectory in the uz-plane of a fence made from a polyline in the xy-plane of a
 * seismic cube in the xyz-coordinate system.
 *
 * This implies common z-coordinate, and the u-coordinate is the projection - i.e. the distance
 * along the polyline in the xy-plane.
 */
function makeTrajectoryFenceProjectionFromPolylineXy(
    polylineXyUtm: number[],
    actualSectionLengths: number[],
    resolution: number,
    extensionLength: number,
): number[][] {
    // Calculate uz projection of the trajectory
    const trajectoryFenceProjection: number[][] = [];
    const polyline = polylineXyUtm;

    let u = -extensionLength;
    trajectoryFenceProjection.push([u, 0]);
    for (let i = 2; i < polyline.length; i += 2) {
        const distance = point2Distance(
            { x: polyline[i], y: polyline[i + 1] },
            { x: polyline[i - 2], y: polyline[i - 1] },
        );

        const actualDistance = actualSectionLengths[i / 2 - 1];
        const scale = actualDistance / distance;
        const numPoints = Math.floor(distance / resolution) - 1;

        for (let p = 1; p <= numPoints; p++) {
            u += resolution * scale;
            trajectoryFenceProjection.push([u, 0]);
        }
    }
    return trajectoryFenceProjection;
}

export function createIntersectionRealizationSeismicLayerItemsMaker({
    id,
    getData,
    getSetting,
    getStoredData,
    name,
}: TransformerArgs<
    IntersectionRealizationSeismicSettings,
    IntersectionRealizationSeismicData,
    any,
    any
>): EsvLayerItemsMaker | null {
    const fenceData = getData();
    const colorScale = getSetting(Setting.COLOR_SCALE)?.colorScale;
    const intersectionExtensionLength = getSetting(Setting.INTERSECTION_EXTENSION_LENGTH) ?? 0;
    const sampleResolution = getSetting(Setting.SAMPLE_RESOLUTION_IN_METERS) ?? 1;
    const attribute = getSetting(Setting.ATTRIBUTE);

    const sourcePolylineWithSectionLengths = getStoredData("sourcePolylineWithSectionLengths");

    if (!fenceData || !sourcePolylineWithSectionLengths || !colorScale) {
        return null;
    }

    const trajectoryFenceProjection = makeTrajectoryFenceProjectionFromPolylineXy(
        sourcePolylineWithSectionLengths.polylineUtmXy,
        sourcePolylineWithSectionLengths.actualSectionLengths,
        sampleResolution,
        intersectionExtensionLength,
    );

    // Adjust the color scale to the actual data - NOTE: min/max is very compute heavy, callstack limit
    // const adjustedColorScale = colorScale.clone();
    // const minValue = Math.min(...fenceData.fenceTracesFloat32Arr);
    // const maxValue = Math.max(...fenceData.fenceTracesFloat32Arr);
    // adjustedColorScale.setRangeAndMidPoint(minValue, maxValue, 0);

    // The layer has to be created inside EsvIntersection, so we need to return a LayerItem
    const intersectionSeismicLayerItemsMaker: EsvLayerItemsMaker = {
        makeLayerItems: (intersectionReferenceSystem: IntersectionReferenceSystem | null) => {
            void intersectionReferenceSystem; // Not used for this layer
            return [
                {
                    id,
                    name: name,
                    type: LayerType.SEISMIC,
                    options: {
                        data: {
                            propertyName: attribute ?? "",
                            propertyUnit: "",
                            minFenceDepth: fenceData.min_fence_depth,
                            maxFenceDepth: fenceData.max_fence_depth,
                            numSamplesPerTrace: fenceData.num_samples_per_trace,
                            numTraces: fenceData.num_traces,
                            fenceTracesArray: fenceData.fenceTracesFloat32Arr,
                            trajectoryFenceProjection: trajectoryFenceProjection,
                            colorScale: colorScale.clone(),
                        },
                    },
                    hoverable: true,
                },
            ];
        },
    };

    return intersectionSeismicLayerItemsMaker;
}
