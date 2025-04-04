import type { BBox } from "@lib/utils/bbox";
import { createTransformedPolylineIntersectionResult } from "@modules/_shared/Intersection/gridIntersectionTransform";
import type {
    IntersectionRealizationGridData,
    IntersectionRealizationGridSettings,
    IntersectionRealizationGridStoredData,
} from "@modules/_shared/LayerFramework/layers/implementations/IntersectionRealizationGridLayer";
import { Setting } from "@modules/_shared/LayerFramework/settings/settingsDefinitions";
import type { FactoryFunctionArgs } from "@modules/_shared/LayerFramework/visualization/VisualizationFactory";

/**
 * Build a bounding box for the intersection grid data.
 *
 * The intersection uz-coordinates are provided as the xy-coordinates of the bounding box,
 * as they are to be visualized in a 2D view.
 */
export function makeIntersectionGridBoundingBox({
    getData,
    getStoredData,
    getSetting,
}: FactoryFunctionArgs<
    IntersectionRealizationGridSettings,
    IntersectionRealizationGridData,
    IntersectionRealizationGridStoredData,
    any
>): BBox | null {
    const polylineIntersectionData = getData();
    const intersectionExtensionLength = getSetting(Setting.INTERSECTION_EXTENSION_LENGTH);
    const polylineActualSectionLengths = getStoredData("polylineWithSectionLengths")?.actualSectionLengths;

    if (!polylineIntersectionData || !intersectionExtensionLength || !polylineActualSectionLengths) {
        return null;
    }

    if (polylineIntersectionData.fenceMeshSections.length !== polylineActualSectionLengths.length) {
        throw new Error(
            "The number of fence mesh sections does not match the number of requested actual section lengths",
        );
    }

    const transformedPolylineIntersection = createTransformedPolylineIntersectionResult(
        polylineIntersectionData,
        polylineActualSectionLengths,
    );

    const minX = -intersectionExtensionLength;
    let maxX = -intersectionExtensionLength;
    let minY = Number.MAX_VALUE;
    let maxY = Number.MIN_VALUE;

    for (const section of transformedPolylineIntersection.fenceMeshSections) {
        maxX += section.sectionLength;

        minY = Math.min(minY, section.minZ);
        maxY = Math.max(maxY, section.maxZ);
    }

    return {
        min: {
            x: minX,
            y: minY,
            z: 0,
        },
        max: {
            x: maxX,
            y: maxY,
            z: 0,
        },
    };
}
