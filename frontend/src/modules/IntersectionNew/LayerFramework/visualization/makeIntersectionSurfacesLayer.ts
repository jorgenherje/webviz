import { SurfaceData } from "@equinor/esv-intersection";
import { Setting } from "@modules/_shared/LayerFramework/settings/settingsDefinitions";
import { FactoryFunctionArgs } from "@modules/_shared/LayerFramework/visualization/VisualizationFactory";
import { LayerItem, LayerType } from "@modules/_shared/components/EsvIntersection";

import {
    IntersectionSurfacesData,
    IntersectionSurfacesSettings,
} from "../customLayerImplementations/IntersectionSurfacesLayer";

export function makeIntersectionSurfacesLayer({
    id,
    name,
    getData,
    getSetting,
}: FactoryFunctionArgs<IntersectionSurfacesSettings, IntersectionSurfacesData>): LayerItem[] | null {
    const data = getData();
    const colorSet = getSetting(Setting.COLOR_SET);

    if (!data || !colorSet) {
        return null;
    }

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
