import { SurfaceIntersectionData_api } from "@api";
import { SurfaceData } from "@equinor/esv-intersection";
import { ColorSet } from "@lib/utils/ColorSet";
import { VisualizationFunctionArgs } from "@modules/_shared/LayerFramework/visualization/VisualizationFactory";
import { LayerItem, LayerType } from "@modules/_shared/components/EsvIntersection";

import { IntersectionSurfaceSettings } from "../customLayerImplementations/IntersectionSurfaceLayer/types";

export function makeIntersectionSurfaceLayer({
    id,
    name,
    data,
    colorScale,
}: VisualizationFunctionArgs<IntersectionSurfaceSettings, SurfaceIntersectionData_api[]>): LayerItem[] {
    // TODO: How to get the color set?
    const colorSet = new ColorSet(colorScale.getColorPalette());

    let currentColor = colorSet.getFirstColor();
    const surfaceData: SurfaceData = {
        areas: [],
        lines: data.map((surface) => {
            const color = currentColor;
            currentColor = colorSet.getNextColor();
            return {
                data: surface.cum_lengths.map((el, index) => [el, surface.z_points[index]]),
                color: color,
                id: surface.name,
                label: surface.name,
            };
        }),
    };
    const layerItems: LayerItem[] = [
        {
            id: `${id}-surfaces`,
            name: name,
            type: LayerType.GEOMODEL_CANVAS,
            hoverable: true,
            options: {
                data: surfaceData,
                // order,
                referenceSystem: undefined, //props.referenceSystem ?? undefined,
            },
        },
        {
            id: `${id}-surfaces-labels`,
            name: `${name}-labels`,
            type: LayerType.GEOMODEL_LABELS,
            options: {
                data: surfaceData,
                // order,
                referenceSystem: undefined, //props.referenceSystem ?? undefined,
            },
        },
    ];

    return layerItems;
}
