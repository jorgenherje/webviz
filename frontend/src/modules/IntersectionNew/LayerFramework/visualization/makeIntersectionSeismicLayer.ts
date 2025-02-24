import { point2Distance } from "@lib/utils/vec2";
import { SeismicPolylineAndFenceData } from "@modules/_shared/Intersection/seismicIntersectionTransform";
import { createPolylineXyFromSeismicFencePolyline } from "@modules/_shared/Intersection/seismicIntersectionUtils";
import { IntersectionRealizationObservedSeismicSettings } from "@modules/_shared/LayerFramework/layers/implementations/IntersectionRealizationObservedSeismicLayer";
import { IntersectionRealizationSimulatedSeismicSettings } from "@modules/_shared/LayerFramework/layers/implementations/IntersectionRealizationSimulatedSeismicLayer";
import { VisualizationFunctionArgs } from "@modules/_shared/LayerFramework/visualization/VisualizationFactory";
import { LayerItem, LayerType } from "@modules/_shared/components/EsvIntersection";

/**
 * Make a trajectory in the uz-plane of a fence made from a polyline in the xy-plane of a
 * seismic cube in the xyz-coordinate system.
 *
 * This implies common z-coordinate, and the u-coordinate is the projection - i.e. the distance
 * along the polyline in the xy-plane.
 */
function makeTrajectoryFenceProjectionFromPolylineXy(
    polylineXyUtm: number[],
    resolution: number,
    extensionLength: number
): number[][] {
    // Calculate uz projection of the trajectory
    const trajectoryFenceProjection: number[][] = [];
    const polyline = polylineXyUtm;

    let u = -extensionLength;
    trajectoryFenceProjection.push([u, 0]);
    for (let i = 2; i < polyline.length; i += 2) {
        const distance = point2Distance(
            { x: polyline[i], y: polyline[i + 1] },
            { x: polyline[i - 2], y: polyline[i - 1] }
        );

        // TODO: What is "actualSectionLengths" needed for, isn't it just the distance?
        // const actualDistance = this._settings.polyline.actualSectionLengths[i / 2 - 1];
        // const scale = actualDistance / distance;
        const numPoints = Math.floor(distance / resolution) - 1;
        const scale = 1;

        for (let p = 1; p <= numPoints; p++) {
            u += resolution * scale;
            trajectoryFenceProjection.push([u, 0]);
        }
    }
    return trajectoryFenceProjection;
}

export function makeIntersectionRealizationSeismicLayerItemOfType<
    T extends IntersectionRealizationSimulatedSeismicSettings | IntersectionRealizationObservedSeismicSettings
>({ id, name, data, colorScale, settings }: VisualizationFunctionArgs<T, SeismicPolylineAndFenceData>): LayerItem {
    const fenceData = data.fenceData;

    // TODO: Add sample resolution as a setting?
    const sampleResolution = 1;
    const polylineXyUtm = createPolylineXyFromSeismicFencePolyline(data.seismicFencePolylineUtm);
    const trajectoryFenceProjection = makeTrajectoryFenceProjectionFromPolylineXy(
        polylineXyUtm,
        sampleResolution,
        settings.intersectionExtensionLength ?? 0
    );

    // The layer has to be created inside EsvIntersection, so we need to return a LayerItem
    const seismicIntersectionLayerItem: LayerItem = {
        id,
        type: LayerType.SEISMIC,
        options: {
            data: {
                propertyName: name, // Attribute name?
                propertyUnit: "",
                minFenceDepth: fenceData.max_fence_depth,
                maxFenceDepth: fenceData.min_fence_depth,
                numSamplesPerTrace: fenceData.num_samples_per_trace,
                numTraces: fenceData.num_traces,
                fenceTracesArray: fenceData.fenceTracesFloat32Arr,
                trajectoryFenceProjection: trajectoryFenceProjection,
                colorScale: colorScale,
            },
        },
    };

    return seismicIntersectionLayerItem;
}
