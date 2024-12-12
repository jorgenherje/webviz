import { DeltaEnsemble } from "@framework/DeltaEnsemble";
import { EnsembleIdent } from "@framework/EnsembleIdent";
import { RegularEnsemble } from "@framework/RegularEnsemble";

export function makeDistinguishableEnsembleDisplayName(
    ensembleIdent: string,
    allEnsembles: readonly (RegularEnsemble | DeltaEnsemble)[]
): string {
    const ensemble = allEnsembles.find((ensemble) => ensemble.getIdent() === ensembleIdent);

    if (ensemble) {
        const customName = ensemble.getCustomName();
        if (customName) {
            return customName;
        }
    }

    const ensembleName = EnsembleIdent.regularEnsembleCaseUuidAndNameFromString(ensembleIdent).ensembleName;
    if (!ensemble) {
        return ensembleName;
    }

    const ensembleNameCount = allEnsembles.filter((elm) => elm.getEnsembleName() === ensembleName).length;
    if (ensembleNameCount === 1) {
        return ensembleName;
    }

    return ensemble.getDisplayName();
}
