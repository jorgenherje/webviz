import type { SeismicCubeSpec_api } from "@api";

import type { PolylineWithSectionLengths } from "./intersectionPolylineTypes";

type Point2D = { x: number; y: number };

/**
 * Transform a point from UTM coordinates to the seismic cube's local coordinate system.
 *
 * The local coordinate system has its origin at (xOrigin, yOrigin) and is rotated
 * by rotationDeg degrees around the z-axis.
 */
function utmToLocal(point: Point2D, spec: SeismicCubeSpec_api): Point2D {
    const rotationRad = (spec.rotationDeg * Math.PI) / 180.0;
    const cosR = Math.cos(rotationRad);
    const sinR = Math.sin(rotationRad);

    // Translate to origin, then rotate by -rotationDeg (inverse rotation)
    const dx = point.x - spec.xOrigin;
    const dy = point.y - spec.yOrigin;

    return {
        x: dx * cosR + dy * sinR,
        y: -dx * sinR + dy * cosR,
    };
}

/**
 * Transform a point from the seismic cube's local coordinate system back to UTM.
 */
function localToUtm(point: Point2D, spec: SeismicCubeSpec_api): Point2D {
    const rotationRad = (spec.rotationDeg * Math.PI) / 180.0;
    const cosR = Math.cos(rotationRad);
    const sinR = Math.sin(rotationRad);

    // Rotate by +rotationDeg, then translate back
    return {
        x: point.x * cosR - point.y * sinR + spec.xOrigin,
        y: point.x * sinR + point.y * cosR + spec.yOrigin,
    };
}

/**
 * Get the cell index (column, row) for a point in local coordinates.
 */
function getCellIndex(localPoint: Point2D, xInc: number, yInc: number, yFlip: number): { col: number; row: number } {
    const col = Math.floor(localPoint.x / Math.abs(xInc));
    // Account for yFlip: if yFlip=-1, y-coordinates are negative for positive row indices
    const row = Math.floor((localPoint.y * yFlip) / Math.abs(yInc));
    return { col, row };
}

/**
 * Get the center point of a cell in local coordinates.
 */
function getCellCenter(col: number, row: number, xInc: number, yInc: number, yFlip: number): Point2D {
    const absXInc = Math.abs(xInc);
    const absYInc = Math.abs(yInc);
    return {
        x: (col + 0.5) * absXInc,
        y: (row + 0.5) * absYInc * yFlip,
    };
}

/**
 * Find all cells that a line segment passes through using a DDA-style algorithm.
 *
 * Returns an ordered list of (col, row) pairs representing cells the segment crosses,
 * from start to end.
 */
function findCellsAlongSegment(
    startLocal: Point2D,
    endLocal: Point2D,
    xInc: number,
    yInc: number,
    yFlip: number,
): Array<{ col: number; row: number }> {
    const absXInc = Math.abs(xInc);
    const absYInc = Math.abs(yInc);

    const startCell = getCellIndex(startLocal, xInc, yInc, yFlip);
    const endCell = getCellIndex(endLocal, xInc, yInc, yFlip);

    // If start and end are in the same cell, return just that cell
    if (startCell.col === endCell.col && startCell.row === endCell.row) {
        return [startCell];
    }

    const cells: Array<{ col: number; row: number }> = [];
    const dx = endLocal.x - startLocal.x;
    const dy = endLocal.y - startLocal.y;

    // Use parametric stepping to find cell crossings
    // Step along the segment and record each new cell we enter
    let currentCol = startCell.col;
    let currentRow = startCell.row;
    cells.push({ col: currentCol, row: currentRow });

    // Calculate how much t changes when crossing a cell boundary
    const tDeltaX = Math.abs(dx) > 1e-10 ? absXInc / Math.abs(dx) : Infinity;
    const tDeltaY = Math.abs(dy) > 1e-10 ? absYInc / Math.abs(dy) : Infinity;

    // Calculate t values for first cell boundary crossings
    let tMaxX: number;
    let tMaxY: number;

    if (Math.abs(dx) > 1e-10) {
        if (dx > 0) {
            // Moving in positive x direction, next boundary is at (col+1) * absXInc
            tMaxX = ((currentCol + 1) * absXInc - startLocal.x) / dx;
        } else {
            // Moving in negative x direction, next boundary is at col * absXInc
            tMaxX = (currentCol * absXInc - startLocal.x) / dx;
        }
    } else {
        tMaxX = Infinity;
    }

    if (Math.abs(dy) > 1e-10) {
        // Account for yFlip when determining direction
        const effectiveStartY = startLocal.y * yFlip;
        const effectiveDy = dy * yFlip;

        if (effectiveDy > 0) {
            tMaxY = ((currentRow + 1) * absYInc - effectiveStartY) / effectiveDy;
        } else {
            tMaxY = (currentRow * absYInc - effectiveStartY) / effectiveDy;
        }
    } else {
        tMaxY = Infinity;
    }

    const stepX = dx > 0 ? 1 : -1;
    const stepY = dy * yFlip > 0 ? 1 : -1;

    // Step through cells until we reach the end
    while (tMaxX < 1 || tMaxY < 1) {
        if (tMaxX < tMaxY) {
            currentCol += stepX;
            tMaxX += tDeltaX;
        } else {
            currentRow += stepY;
            tMaxY += tDeltaY;
        }

        cells.push({ col: currentCol, row: currentRow });

        // Safety check to prevent infinite loops
        if (cells.length > 10000) {
            console.warn("Too many cells in segment, breaking");
            break;
        }
    }

    return cells;
}

/**
 * Resample a polyline to have one point at the center of each seismic cube cell it crosses.
 *
 * This function determines which cells (col, row) in the seismic cube's (x,y) plane
 * each polyline segment passes through, and returns a new polyline with points at
 * the center of each crossed cell.
 *
 * The seismic cube has a local coordinate system defined by:
 * - Origin at (xOrigin, yOrigin)
 * - Rotation by rotationDeg around the z-axis
 * - Grid cells of size xInc × yInc
 * - numCols columns and numRows rows
 *
 * The result ensures that the seismic fence API (which returns one trace per point)
 * provides exactly one trace per cell the polyline passes through.
 *
 * @param polylineWithSectionLengths - The input polyline in UTM coordinates with section lengths
 * @param seismicCubeSpec - The seismic cube specification containing grid parameters
 * @returns A new polyline with points at cell centers, preserving section structure
 */
export function resamplePolylineToSeismicCubeCellCenters(
    polylineWithSectionLengths: PolylineWithSectionLengths,
    seismicCubeSpec: SeismicCubeSpec_api,
): PolylineWithSectionLengths {
    const { polylineUtmXy, actualSectionLengths } = polylineWithSectionLengths;
    const numPoints = polylineUtmXy.length / 2;

    if (numPoints < 2) {
        return polylineWithSectionLengths;
    }

    if (actualSectionLengths.length !== numPoints - 1) {
        throw new Error("The number of section lengths must be one less than the number of points");
    }

    const resampledPolylineUtmXy: number[] = [];
    const resampledSectionLengths: number[] = [];

    // Process each segment
    for (let i = 0; i < numPoints - 1; i++) {
        const startUtm: Point2D = { x: polylineUtmXy[i * 2], y: polylineUtmXy[i * 2 + 1] };
        const endUtm: Point2D = { x: polylineUtmXy[(i + 1) * 2], y: polylineUtmXy[(i + 1) * 2 + 1] };
        const sectionLength = actualSectionLengths[i];

        // Transform to local coordinates
        const startLocal = utmToLocal(startUtm, seismicCubeSpec);
        const endLocal = utmToLocal(endUtm, seismicCubeSpec);

        // Find all cells this segment crosses
        const cells = findCellsAlongSegment(
            startLocal,
            endLocal,
            seismicCubeSpec.xInc,
            seismicCubeSpec.yInc,
            seismicCubeSpec.yFlip,
        );

        // Get cell centers and transform back to UTM
        const cellCentersUtm: Point2D[] = cells.map((cell) => {
            const centerLocal = getCellCenter(
                cell.col,
                cell.row,
                seismicCubeSpec.xInc,
                seismicCubeSpec.yInc,
                seismicCubeSpec.yFlip,
            );
            return localToUtm(centerLocal, seismicCubeSpec);
        });

        // Add cell centers to the resampled polyline
        // Distribute section length evenly among the points
        const numCellsInSegment = cellCentersUtm.length;

        for (let j = 0; j < numCellsInSegment; j++) {
            const center = cellCentersUtm[j];

            // For the first point of the first segment, add it directly
            // For subsequent points, check if it's different from the last added point
            if (resampledPolylineUtmXy.length === 0) {
                resampledPolylineUtmXy.push(center.x, center.y);
            } else {
                const lastX = resampledPolylineUtmXy[resampledPolylineUtmXy.length - 2];
                const lastY = resampledPolylineUtmXy[resampledPolylineUtmXy.length - 1];

                // Check if this is a new point (not duplicate of last)
                const dx = center.x - lastX;
                const dy = center.y - lastY;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist > 1e-6) {
                    resampledPolylineUtmXy.push(center.x, center.y);
                    // Section length proportional to number of cells
                    resampledSectionLengths.push(sectionLength / numCellsInSegment);
                }
            }
        }
    }

    // Handle edge case: if we only have one point, return original
    if (resampledPolylineUtmXy.length < 4) {
        return polylineWithSectionLengths;
    }

    return {
        polylineUtmXy: resampledPolylineUtmXy,
        actualSectionLengths: resampledSectionLengths,
    };
}
