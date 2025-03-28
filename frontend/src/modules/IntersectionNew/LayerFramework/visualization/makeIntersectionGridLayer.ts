import { createTransformedPolylineIntersectionResult } from "@modules/_shared/Intersection/gridIntersectionTransform";
import {
    IntersectionRealizationGridData,
    IntersectionRealizationGridSettings,
    IntersectionRealizationGridStoredData,
} from "@modules/_shared/LayerFramework/layers/implementations/IntersectionRealizationGridLayer";
import { Setting } from "@modules/_shared/LayerFramework/settings/settingsDefinitions";
import { FactoryFunctionArgs } from "@modules/_shared/LayerFramework/visualization/VisualizationFactory";
import { LayerItem, LayerType } from "@modules/_shared/components/EsvIntersection";

export function makeIntersectionRealizationGridLayer({
    id,
    getData,
    getSetting,
    getStoredData,
    name,
}: FactoryFunctionArgs<
    IntersectionRealizationGridSettings,
    IntersectionRealizationGridData,
    IntersectionRealizationGridStoredData
>): LayerItem[] | null {
    const intersectionData = getData();
    const colorScale = getSetting(Setting.COLOR_SCALE)?.colorScale;
    const intersectionExtensionLength = getSetting(Setting.INTERSECTION_EXTENSION_LENGTH) ?? 0;
    const showGridLines = getSetting(Setting.SHOW_GRID_LINES);
    const sourcePolylineActualSectionLengths = getStoredData("polylineWithSectionLengths")?.actualSectionLengths;

    if (!intersectionData || !sourcePolylineActualSectionLengths || !colorScale) {
        return null;
    }

    const transformedPolylineIntersection = createTransformedPolylineIntersectionResult(
        intersectionData,
        sourcePolylineActualSectionLengths
    );

    // TODO: Always use custom boundaries for the color scale?
    const adjustedColorScale = colorScale.clone();
    const min = transformedPolylineIntersection.min_grid_prop_value;
    const max = transformedPolylineIntersection.max_grid_prop_value;
    const mid = min + (max - min) / 2;
    adjustedColorScale.setRangeAndMidPoint(min, max, mid);

    // The layer has to be created inside EsvIntersection, so we need to return a LayerItem
    const gridIntersectionLayerItem: LayerItem = {
        id,
        name: name,
        type: LayerType.POLYLINE_INTERSECTION,
        options: {
            data: {
                fenceMeshSections: transformedPolylineIntersection.fenceMeshSections.map((section) => ({
                    verticesUzArr: section.verticesUzFloat32Arr,
                    verticesPerPolyArr: section.verticesPerPolyUintArr,
                    polySourceCellIndicesArr: section.polySourceCellIndicesUint32Arr,
                    polyPropsArr: section.polyPropsFloat32Arr,
                    polyIndicesArr: section.polyIndicesUintArr,
                    sectionLength: section.sectionLength,
                    minZ: section.minZ,
                    maxZ: section.maxZ,
                })),
                minGridPropValue: transformedPolylineIntersection.min_grid_prop_value,
                maxGridPropValue: transformedPolylineIntersection.max_grid_prop_value,
                colorScale: adjustedColorScale,
                hideGridlines: showGridLines,
                extensionLengthStart: intersectionExtensionLength,
                gridDimensions: {
                    cellCountI: transformedPolylineIntersection.grid_dimensions.i_count,
                    cellCountJ: transformedPolylineIntersection.grid_dimensions.j_count,
                    cellCountK: transformedPolylineIntersection.grid_dimensions.k_count,
                },
                propertyName: "", // settings.parameterName ?? "",
                propertyUnit: "",
            },
        },
        hoverable: true,
    };

    return [gridIntersectionLayerItem];
}
