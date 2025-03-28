import { ReferenceLine } from "@equinor/esv-intersection";
import { WellboreHeader } from "@modules/IntersectionNew/typesAndEnums";
import { LayerItem, LayerType } from "@modules/_shared/components/EsvIntersection";

/**
 * Create reference lines for esv-intersection
 *
 * Optional wellboreHeader parameter to create a reference line for the wellbore header
 */
function createReferenceLines(wellboreHeader: WellboreHeader | null): ReferenceLine[] {
    const referenceLines: ReferenceLine[] = [
        {
            depth: 0,
            text: "MSL",
            color: "blue",
            lineType: "wavy",
            textColor: "blue",
        },
    ];

    if (wellboreHeader) {
        referenceLines.push({
            depth: -wellboreHeader.depthReferenceElevation,
            text: wellboreHeader.depthReferencePoint,
            color: "black",
            lineType: "dashed",
            textColor: "black",
        });
    }

    return referenceLines;
}

/**
 * Create reference lines layer item for esv-intersection
 *
 * Optional wellboreHeader parameter to create a reference line for the wellbore header
 */
export function createReferenceLinesLayerItem(wellboreHeader: WellboreHeader | null): LayerItem {
    return {
        id: "reference-line",
        name: "Reference line",
        type: LayerType.REFERENCE_LINE,
        hoverable: false,
        options: {
            data: createReferenceLines(wellboreHeader),
        },
    };
}
