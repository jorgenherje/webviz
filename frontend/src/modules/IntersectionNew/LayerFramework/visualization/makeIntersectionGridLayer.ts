import {
    PolylineAndIntersectionData,
    createTransformedPolylineIntersectionResult,
} from "@modules/_shared/Intersection/gridIntersectionTransform";
import { IntersectionRealizationGridSettings } from "@modules/_shared/LayerFramework/layers/implementations/IntersectionRealizationGridLayer/types";
import { VisualizationFunctionArgs } from "@modules/_shared/LayerFramework/visualization/VisualizationFactory";
import { LayerItem, LayerType } from "@modules/_shared/components/EsvIntersection";

export function makeIntersectionRealizationGridLayer({
    id,
    name,
    data,
    colorScale,
    settings,
    getGlobalSetting,
}: VisualizationFunctionArgs<IntersectionRealizationGridSettings, PolylineAndIntersectionData>): LayerItem[] {
    // TODO: How to handle extension length for the polyline when chosen well path as polyline source?
    // This should go into the IntersectionRealizationGridSettings fetch data somehow
    // TODO: With new view settings: Access intersection polyline as a view setting if existing, otherwise use the internal setting
    // TODO: Access source polyline as a storedData element, and use the actualSectionLengths from there instead of the data object
    // being a part of fetchData.

    const transformedPolylineIntersection = createTransformedPolylineIntersectionResult(
        data.intersectionData,
        data.sourcePolyline.actualSectionLengths
    );
    const extensionLength = getGlobalSetting("intersectionExtensionLength") ?? 0;

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
                hideGridlines: !settings.showGridLines,
                extensionLengthStart: extensionLength,
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
