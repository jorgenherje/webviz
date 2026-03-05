/**
 * Given a polyline path and a cumulative length along it, returns the interpolated [x, y, z] position.
 * Clamps to the last point if lengthAlong exceeds the total polyline length.
 */
export function positionAtLengthAlong(path: number[][], lengthAlong: number): [number, number, number] | null {
    if (path.length === 0) return null;
    if (path.length === 1) return [path[0][0], path[0][1], path[0][2] ?? 0];

    let accumulatedSegmentLengths = 0;
    for (let i = 0; i < path.length - 1; i++) {
        const { x0, y0, z0 } = { x0: path[i][0], y0: path[i][1], z0: path[i][2] ?? 0 };
        const { x1, y1, z1 } = { x1: path[i + 1][0], y1: path[i + 1][1], z1: path[i + 1][2] ?? 0 };
        const { dx, dy, dz } = { dx: x1 - x0, dy: y1 - y0, dz: z1 - z0 };

        const segLen = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (accumulatedSegmentLengths + segLen >= lengthAlong) {
            const t = segLen > 0 ? (lengthAlong - accumulatedSegmentLengths) / segLen : 0;
            return [x0 + t * dx, y0 + t * dy, z0 + t * dz];
        }
        accumulatedSegmentLengths += segLen;
    }

    // Beyond the end: clamp to last point
    const last = path[path.length - 1];
    return [last[0], last[1], last[2] ?? 0];
}

/**
 * Projects the given (x, y) point onto the nearest segment of the polyline and returns
 * the cumulative length along the polyline to that projected point.
 * Uses the x, y, and z components of each path point for segment length calculation,
 * but projects only in the x/y plane (cursor position has no z).
 */
export function lengthAlongAtPosition(path: number[][], x: number, y: number): number {
    if (path.length < 2) return 0;

    let bestLength = 0;
    let bestDistSq = Infinity;
    let accumulated = 0;

    for (let i = 0; i < path.length - 1; i++) {
        const { x0, y0, z0 } = { x0: path[i][0], y0: path[i][1], z0: path[i][2] ?? 0 };
        const { x1, y1, z1 } = { x1: path[i + 1][0], y1: path[i + 1][1], z1: path[i + 1][2] ?? 0 };
        const { dx, dy, dz } = { dx: x1 - x0, dy: y1 - y0, dz: z1 - z0 };

        const segLen = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const segLenXySq = dx * dx + dy * dy;

        const t = segLenXySq > 0 ? Math.max(0, Math.min(1, ((x - x0) * dx + (y - y0) * dy) / segLenXySq)) : 0;

        const px = x0 + t * dx,
            py = y0 + t * dy;
        const distSq = (x - px) ** 2 + (y - py) ** 2;

        if (distSq < bestDistSq) {
            bestDistSq = distSq;
            bestLength = accumulated + t * segLen;
        }
        accumulated += segLen;
    }

    return bestLength;
}
