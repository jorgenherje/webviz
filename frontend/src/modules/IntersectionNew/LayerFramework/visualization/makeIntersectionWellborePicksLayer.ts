import { WellborePick_api } from "@api";
import { getPicksData, transformFormationData } from "@equinor/esv-intersection";
import { VisualizationFunctionArgs } from "@modules/_shared/LayerFramework/visualization/VisualizationFactory";
import { LayerItem, LayerType } from "@modules/_shared/components/EsvIntersection";

import { EnsembleWellborePicksSettings } from "../customLayerImplementations/EnsembleWellborePicksLayer";

export function makeWellborePicksLayer({
    id,
    name,
    data,
}: VisualizationFunctionArgs<EnsembleWellborePicksSettings, WellborePick_api[]>): LayerItem[] {
    // Convert Picks from api to esv-intersection format
    // Picks can be transformed into unit and non-unit picks, we are placing all in non-unit picks for now
    const emptyUnitList: any[] = [];
    const pickData = transformFormationData(data, emptyUnitList);

    const wellborePicksLayerItem: LayerItem = {
        id,
        name,
        type: LayerType.CALLOUT_CANVAS,
        hoverable: false,
        options: {
            data: getPicksData(pickData),
            referenceSystem: undefined, //props.referenceSystem ?? undefined,
        },
    };

    return [wellborePicksLayerItem];
}
