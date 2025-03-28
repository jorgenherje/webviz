import { getPicksData, transformFormationData } from "@equinor/esv-intersection";
import { FactoryFunctionArgs } from "@modules/_shared/LayerFramework/visualization/VisualizationFactory";
import { LayerItem, LayerType } from "@modules/_shared/components/EsvIntersection";

import {
    EnsembleWellborePicksData,
    EnsembleWellborePicksSettings,
} from "../customLayerImplementations/EnsembleWellborePicksLayer";

export function makeWellborePicksLayer({
    id,
    name,
    getData,
}: FactoryFunctionArgs<EnsembleWellborePicksSettings, EnsembleWellborePicksData>): LayerItem[] | null {
    const data = getData();

    if (!data) {
        return null;
    }

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
