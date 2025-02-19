import { SeismicFencePolyline_api, getWellTrajectoriesOptions } from "@api";
import { IntersectionReferenceSystem } from "@equinor/esv-intersection";
import { Vec2, normalizeVec2, point2Distance } from "@lib/utils/vec2";
import { QueryClient } from "@tanstack/query-core";

import { ItemDelegate } from "../LayerFramework/delegates/ItemDelegate";
import { IntersectionSettingValue } from "../LayerFramework/settings/implementations/IntersectionSetting";
import { calcExtendedSimplifiedWellboreTrajectoryInXYPlane } from "../utils/wellbore";

/**
 * Make promise with polyline XY UTM coordinates for requested delegate and intersection setting value.
 *
 * Returns promise with array of polyline XY UTM coordinates.
 */
export function makeIntersectionPolylineXyUtmPromiseForDelegate(
    intersection: IntersectionSettingValue,
    itemDelegate: ItemDelegate,
    queryClient: QueryClient
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
                            0,
                            5
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
 * Create resampled seismic fence polyline from polyline XY UTM coordinates.
 *
 * Takes a polyline xy utm coordinates and a sample step and returns a resampled seismic fence polyline,
 * where the sample step is the distance between each point in the resampled polyline.
 */
export function createResampledSeismicFencePolyline(
    polylineXyUtm: number[],
    sampleStep: number
): SeismicFencePolyline_api {
    const xPoints: number[] = [];
    const yPoints: number[] = [];
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
                xPoints.push(polylineXyUtm[i - 2] + normalizedVector.x * limitedSampleStep * p);
                yPoints.push(polylineXyUtm[i - 1] + normalizedVector.y * limitedSampleStep * p);
            }
        }

        xPoints.push(polylineXyUtm[i]);
        yPoints.push(polylineXyUtm[i + 1]);
    }

    return { x_points: xPoints, y_points: yPoints };
}
