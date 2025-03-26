/**
 * A polyline with section lengths.
 *
 * The polyline can be simplified or down-sampled, and the section lengths are
 * the actual lengths of the polyline sections.
 */
export type PolylineWithSectionLengths = {
    polylineUtmXy: number[];
    actualSectionLengths: number[];
};
