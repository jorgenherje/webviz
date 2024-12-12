import { ViewContext } from "@framework/ModuleContext";
import { Interfaces } from "@modules/SimulationTimeSeries/interfaces";
import { makeDistinguishableEnsembleDisplayName } from "@modules/_shared/ensembleNameUtils";

export function useMakeEnsembleDisplayNameFunc(
    viewContext: ViewContext<Interfaces>
): (ensembleIdent: string) => string {
    const selectedRegularEnsembles = viewContext.useSettingsToViewInterfaceValue("selectedRegularEnsembles");
    const selectedDeltaEnsembles = viewContext.useSettingsToViewInterfaceValue("selectedDeltaEnsembles");
    const allSelectedEnsembles = [...selectedRegularEnsembles, ...selectedDeltaEnsembles];

    return function makeEnsembleDisplayName(ensembleIdent: string): string {
        return makeDistinguishableEnsembleDisplayName(ensembleIdent, allSelectedEnsembles);
    };
}
