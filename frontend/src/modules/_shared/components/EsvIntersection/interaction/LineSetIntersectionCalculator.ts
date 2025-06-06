
import type { IntersectedItem, IntersectionCalculator } from "../types/types";
import { IntersectionItemShape } from "../types/types";
import { calcDistance } from "../utils/geometry";

import { LineIntersectionCalculator } from "./LineIntersectionCalculator";

export interface LineSetIntersectedItem extends IntersectedItem {
    shape: IntersectionItemShape.LINE_SET;
    line: number[][];
    points: number[][];
}

export class LineSetIntersectionCalculator implements IntersectionCalculator {
    private _lineIntersectionCalculators: LineIntersectionCalculator[];
    private _lines: number[][][];

    constructor(lines: number[][][], margin: number = 0) {
        this._lines = lines;
        const lineIntersectionCalculators: LineIntersectionCalculator[] = [];
        for (const line of lines) {
            lineIntersectionCalculators.push(new LineIntersectionCalculator(line, margin));
        }
        this._lineIntersectionCalculators = lineIntersectionCalculators;
    }

    private interpolateY(x: number, p1: number[], p2: number[]): number {
        const x1 = p1[0];
        const y1 = p1[1];
        const x2 = p2[0];
        const y2 = p2[1];
        return y1 + ((x - x1) * (y2 - y1)) / (x2 - x1);
    }

    private getPointsAtX(x: number): number[][] {
        const points: number[][] = [];

        for (const line of this._lines) {
            for (let i = 0; i < line.length - 1; i++) {
                const p1 = line[i];
                const p2 = line[i + 1];
                if (p1[0] <= x && p2[0] >= x) {
                    points.push([x, this.interpolateY(x, p1, p2)]);
                    continue;
                }
            }
        }

        return points;
    }

    calcIntersection(point: number[]): LineSetIntersectedItem | null {
        let intersectionPoint: number[] | null = null;
        let points: number[][] = [];
        let smallestDistance = Number.MAX_VALUE;

        for (const lineIntersectionCalculator of this._lineIntersectionCalculators) {
            const intersection = lineIntersectionCalculator.calcIntersection(point);
            if (intersection) {
                const distance = calcDistance(intersection.point, point);
                if (distance < smallestDistance) {
                    const x = intersection.point[0];
                    points = this.getPointsAtX(x);
                    intersectionPoint = intersection.point;
                    smallestDistance = distance;
                }
            }
        }

        if (points.length === 0 || !intersectionPoint) {
            return null;
        }

        const x = intersectionPoint[0];

        const yMin = Math.min(...points.map((p) => p[1]));
        const yMax = Math.max(...points.map((p) => p[1]));

        return {
            shape: IntersectionItemShape.LINE_SET,
            line: [
                [x, yMin],
                [x, yMax],
            ],
            points: points,
            point: intersectionPoint,
        };
    }
}
