import { getWellTrajectoriesOptions } from "@api";
import { IntersectionReferenceSystem } from "@equinor/esv-intersection";
import { IntersectionType } from "@framework/types/intersection";
import { IntersectionPolyline } from "@framework/userCreatedItems/IntersectionPolylines";
import { Vec2, normalizeVec2, point2Distance, vec2FromArray } from "@lib/utils/vec2";
import { QueryClient } from "@tanstack/query-core";

import { PolylineWithSectionLengths } from "./intersectionPolylineTypes";

import { calcExtendedSimplifiedWellboreTrajectoryInXYPlane } from "../utils/wellbore";

export const CURVE_FITTING_EPSILON = 5; // meter

export type PolylineIntersectionSpecification = {
    type: IntersectionType.CUSTOM_POLYLINE;
    polyline: IntersectionPolyline;
};

export type WellboreIntersectionSpecification = {
    type: IntersectionType.WELLBORE;
    wellboreUuid: string;
    intersectionExtensionLength: number;
    fieldIdentifier: string;
    queryClient: QueryClient;
};

export type IntersectionSpecification = PolylineIntersectionSpecification | WellboreIntersectionSpecification;

/**
 * Make promise with polyline XY UTM coordinates and actual section lengths for requested intersection specification.
 *
 * Returns promise with array of polyline XY UTM coordinates and actual section lengths.
 *
 * Actual section lengths are the actual lengths of the polyline sections for polyline which can be
 * down sampled or simplified.
 */
export function makeIntersectionPolylineWithSectionLengthsPromise(
    intersectionSpecification: IntersectionSpecification
): Promise<PolylineWithSectionLengths> {
    // Polyline intersection
    if (intersectionSpecification.type === IntersectionType.CUSTOM_POLYLINE) {
        const { polyline } = intersectionSpecification;
        const polylineUtmXy: number[] = [];
        const actualSectionLengths: number[] = [];
        for (const [index, point] of polyline.path.entries()) {
            polylineUtmXy.push(point[0], point[1]);
            if (index > 0) {
                const previousPoint = polyline.path[index - 1];
                actualSectionLengths.push(point2Distance(vec2FromArray(point), vec2FromArray(previousPoint)));
            }
        }

        return Promise.resolve({ polylineUtmXy, actualSectionLengths });
    }

    // Wellbore intersection
    const { intersectionExtensionLength, wellboreUuid, fieldIdentifier, queryClient } = intersectionSpecification;
    const makePolylineAndActualSectionLengthsPromise = new Promise<PolylineWithSectionLengths>(async (resolve) => {
        const wellTrajectoryData = await queryClient.fetchQuery({
            ...getWellTrajectoriesOptions({
                query: {
                    field_identifier: fieldIdentifier ?? "",
                    wellbore_uuids: [wellboreUuid],
                },
            }),
        });
        const wellTrajectoryPath: number[][] = [];
        for (const [index, northing] of wellTrajectoryData[0].northingArr.entries()) {
            const easting = wellTrajectoryData[0].eastingArr[index];
            const tvd_msl = wellTrajectoryData[0].tvdMslArr[index];

            wellTrajectoryPath.push([easting, northing, tvd_msl]);
        }

        const simplifiedWellboreTrajectory = calcExtendedSimplifiedWellboreTrajectoryInXYPlane(
            wellTrajectoryPath,
            intersectionExtensionLength,
            CURVE_FITTING_EPSILON
        );

        const polylineUtmXy = simplifiedWellboreTrajectory.simplifiedWellboreTrajectoryXy.flat();
        const actualSectionLengths = simplifiedWellboreTrajectory.actualSectionLengths;
        resolve({ polylineUtmXy, actualSectionLengths });
    });

    return makePolylineAndActualSectionLengthsPromise;
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
