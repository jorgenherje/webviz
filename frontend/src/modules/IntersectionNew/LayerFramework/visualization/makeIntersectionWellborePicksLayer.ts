import { getPicksData, transformFormationData } from "@equinor/esv-intersection";
import type {
    EsvLayerItemsMaker,
    FactoryFunctionArgs,
} from "@modules/_shared/LayerFramework/visualization/VisualizationFactory";
import { LayerType } from "@modules/_shared/components/EsvIntersection";

import type { EnsembleWellborePicksSettings } from "../customLayerImplementations/EnsembleWellborePicksLayer";

export function createWellborePicksLayerItemsMaker({
    id,
    name,
    getData,
}: FactoryFunctionArgs<EnsembleWellborePicksSettings, any, any, any>): EsvLayerItemsMaker | null {
    const selectedWellborePicks = getData();
    if (!selectedWellborePicks) {
        return null;
    }

    // Convert Picks from api to esv-intersection format
    // Picks can be transformed into unit and non-unit picks, we are placing all in non-unit picks for now
    const emptyUnitList: any[] = [];
    const pickData = transformFormationData(selectedWellborePicks, emptyUnitList);

    const wellborePicksLayerItemsMaker: EsvLayerItemsMaker = {
        makeLayerItems: (intersectionReferenceSystem) => {
            return [
                {
                    id,
                    name,
                    type: LayerType.CALLOUT_CANVAS,
                    hoverable: false,
                    options: {
                        data: getPicksData(pickData),
                        referenceSystem: intersectionReferenceSystem ?? undefined,
                    },
                },
            ];
        },
    };

    return wellborePicksLayerItemsMaker;
}
