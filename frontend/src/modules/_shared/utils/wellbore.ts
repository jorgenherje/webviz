import { point2Distance, vec2FromArray } from "@lib/utils/vec2";

import simplify from "simplify-js";

function normalizeVector(vector: number[]): number[] {
    const vectorLength = Math.sqrt(vector[0] ** 2 + vector[1] ** 2);
    return [vector[0] / vectorLength, vector[1] / vectorLength];
}

export type SimplifiedWellboreTrajectoryInXyPlaneResult = {
    simplifiedWellboreTrajectoryXy: number[][];
    actualSectionLengths: number[];
};

/*
    Calculates a simplified version of the wellbore trajectory in the XY plane by using the Ramer-Douglas-Peucker algorithm.
    Can also extend the trajectory by a specified length in the direction of the first and last non-zero vectors.
    If the wellbore is completely vertical, the trajectory will be extended in the x-direction.
*/
export function calcExtendedSimplifiedWellboreTrajectoryInXYPlane(
    wellboreTrajectory: number[][],
    extensionLength: number = 0,
    epsilon: number = 0.1
): SimplifiedWellboreTrajectoryInXyPlaneResult {
    const simplifiedTrajectoryXy: number[][] = [];
    const actualSectionLengths: number[] = [];

    const adjustedWellboreTrajectory = wellboreTrajectory.map((point) => ({ x: point[0], y: point[1] }));

    const simplifiedCurve = simplify(adjustedWellboreTrajectory, epsilon).map((point) => [point.x, point.y]);

    let lastWellboreTrajectoryIndex = 0;
    for (const [index, point] of simplifiedCurve.entries()) {
        simplifiedTrajectoryXy.push([point[0], point[1]]);

        if (index === 0) {
            continue;
        }

        let sectionLength = 0;
        for (let i = lastWellboreTrajectoryIndex + 1; i < wellboreTrajectory.length; i++) {
            sectionLength += point2Distance(
                vec2FromArray(wellboreTrajectory[i]),
                vec2FromArray(wellboreTrajectory[i - 1])
            );

            if (wellboreTrajectory[i][0] === point[0] && wellboreTrajectory[i][1] === point[1]) {
                actualSectionLengths.push(sectionLength);
                lastWellboreTrajectoryIndex = i;
                break;
            }
        }
    }

    if (extensionLength > 0) {
        const vectorEndPoint = simplifiedCurve[simplifiedCurve.length - 1];
        let vectorStartPoint = vectorEndPoint;
        for (let i = simplifiedCurve.length - 2; i >= 0; i--) {
            if (simplifiedCurve[i][0] !== vectorEndPoint[0] || simplifiedCurve[i][1] !== vectorEndPoint[1]) {
                vectorStartPoint = simplifiedCurve[i];
                break;
            }
        }

        const vector = [vectorEndPoint[0] - vectorStartPoint[0], vectorEndPoint[1] - vectorStartPoint[1]];

        if (vector[0] === 0 && vector[1] === 0) {
            vector[0] = 1;
        }

        const normalizedVector = normalizeVector(vector);

        const extendedFirstPoint = [
            simplifiedCurve[0][0] - normalizedVector[0] * extensionLength,
            simplifiedCurve[0][1] - normalizedVector[1] * extensionLength,
        ];
        const extendedLastPoint = [
            simplifiedCurve[simplifiedCurve.length - 1][0] + normalizedVector[0] * extensionLength,
            simplifiedCurve[simplifiedCurve.length - 1][1] + normalizedVector[1] * extensionLength,
        ];

        simplifiedTrajectoryXy.unshift(extendedFirstPoint);
        simplifiedTrajectoryXy.push(extendedLastPoint);

        actualSectionLengths.unshift(
            point2Distance(vec2FromArray(extendedFirstPoint), vec2FromArray(simplifiedCurve[0]))
        );
        actualSectionLengths.push(
            point2Distance(vec2FromArray(extendedLastPoint), vec2FromArray(simplifiedCurve[simplifiedCurve.length - 1]))
        );
    }

    return {
        simplifiedWellboreTrajectoryXy: simplifiedTrajectoryXy,
        actualSectionLengths,
    };
}
