import { getWellTrajectoriesOptions } from "@api";
import { IntersectionReferenceSystem } from "@equinor/esv-intersection";
import { Vec2, normalizeVec2, point2Distance } from "@lib/utils/vec2";
import { QueryClient } from "@tanstack/query-core";

import { ItemDelegate } from "../LayerFramework/delegates/ItemDelegate";
import { IntersectionSettingValue } from "../LayerFramework/settings/implementations/IntersectionSetting";
import { calcExtendedSimplifiedWellboreTrajectoryInXYPlane } from "../utils/wellbore";

export const CURVE_FITTING_EPSILON = 5; // meter

/**
 * Make promise with polyline XY UTM coordinates for requested delegate and intersection setting value.
 *
 * Returns promise with array of polyline XY UTM coordinates.
 */
export function makeIntersectionPolylineXyUtmPromiseForDelegate(
    intersection: IntersectionSettingValue,
    itemDelegate: ItemDelegate,
    queryClient: QueryClient,
    intersectionExtensionLength = 0,
    curveFittingEpsilon = CURVE_FITTING_EPSILON
): Promise<number[]> {
    const makePolylinePromise = new Promise<number[]>((resolve) => {
        if (intersection.type === "wellbore") {
            const fieldIdentifier = itemDelegate.getLayerManager().getGlobalSetting("fieldId");

            return queryClient
                .fetchQuery({
                    ...getWellTrajectoriesOptions({
                        query: {
                            field_identifier: fieldIdentifier ?? "",
                            wellbore_uuids: [intersection.uuid],
                        },
                    }),
                })
                .then((data) => {
                    const path: number[][] = [];
                    for (const [index, northing] of data[0].northingArr.entries()) {
                        const easting = data[0].eastingArr[index];
                        const tvd_msl = data[0].tvdMslArr[index];

                        path.push([easting, northing, tvd_msl]);
                    }
                    const offset = data[0].tvdMslArr[0];

                    const intersectionReferenceSystem = new IntersectionReferenceSystem(path);
                    intersectionReferenceSystem.offset = offset;

                    const polylineUtmXy: number[] = [];
                    polylineUtmXy.push(
                        ...calcExtendedSimplifiedWellboreTrajectoryInXYPlane(
                            path,
                            intersectionExtensionLength,
                            curveFittingEpsilon
                        ).simplifiedWellboreTrajectoryXy.flat()
                    );

                    resolve(polylineUtmXy);
                });
        } else {
            const intersectionPolyline = itemDelegate
                .getLayerManager()
                .getWorkbenchSession()
                .getUserCreatedItems()
                .getIntersectionPolylines()
                .getPolyline(intersection.uuid);
            if (!intersectionPolyline) {
                resolve([]);
                return;
            }

            const polylineUtmXy: number[] = [];
            for (const point of intersectionPolyline.path) {
                polylineUtmXy.push(point[0], point[1]);
            }

            resolve(polylineUtmXy);
        }
    });

    return makePolylinePromise;
}

/**
 * Create resampled polyline XY UTM coordinates.
 *
 * Takes a polyline xy utm coordinates and a sample step and returns a resampled polyline xy utm coordinates,
 * where the sample step is the distance between each point in the resampled polyline.
 */
export function createResampledPolylineXyUtm(polylineXyUtm: number[], sampleStep: number): number[] {
    const resampledPolyline: number[] = [];
    const limitedSampleStep = Math.max(1, sampleStep);

    for (let i = 0; i < polylineXyUtm.length; i += 2) {
        if (i > 0) {
            const distance = point2Distance(
                { x: polylineXyUtm[i], y: polylineXyUtm[i + 1] },
                { x: polylineXyUtm[i - 2], y: polylineXyUtm[i - 1] }
            );
            const numPoints = Math.floor(distance / limitedSampleStep) - 1;
            const vector: Vec2 = {
                x: polylineXyUtm[i] - polylineXyUtm[i - 2],
                y: polylineXyUtm[i + 1] - polylineXyUtm[i - 1],
            };
            const normalizedVector = normalizeVec2(vector);

            for (let p = 1; p <= numPoints; p++) {
                resampledPolyline.push(polylineXyUtm[i - 2] + normalizedVector.x * limitedSampleStep * p);
                resampledPolyline.push(polylineXyUtm[i - 1] + normalizedVector.y * limitedSampleStep * p);
            }
        }

        resampledPolyline.push(polylineXyUtm[i]);
        resampledPolyline.push(polylineXyUtm[i + 1]);
    }

    return resampledPolyline;
}
