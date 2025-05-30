
import type { IntersectedItem, IntersectionCalculator } from "../types/types";
import { IntersectionItemShape } from "../types/types";

import { BoundingBox2D } from "./BoundingBox2D";

export interface RectangleIntersectedItem extends IntersectedItem {
    shape: IntersectionItemShape.RECTANGLE;
}

export class RectangleIntersectionCalculator implements IntersectionCalculator {
    private _boundingBox: BoundingBox2D;

    constructor(point: number[][]) {
        this._boundingBox = new BoundingBox2D(point[0], point[1]);
    }

    calcIntersection(point: number[]): RectangleIntersectedItem | null {
        if (!this._boundingBox.contains(point)) {
            return null;
        }

        return {
            shape: IntersectionItemShape.RECTANGLE,
            point: point,
        };
    }
}
