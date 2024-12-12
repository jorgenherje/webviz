import { EnsembleRealizationFilterFunction } from "@framework/WorkbenchSession";

export function computeRealizationsIntersection(
    ensembleIdents: string[],
    filterEnsembleRealizations: EnsembleRealizationFilterFunction
) {
    let realizationsIntersection: number[] = [];
    for (const ensembleIdent of ensembleIdents) {
        const realizations = filterEnsembleRealizations(ensembleIdent);
        if (realizationsIntersection.length === 0) {
            realizationsIntersection.push(...realizations);
            continue;
        }
        realizationsIntersection = realizationsIntersection.filter((realization) => realizations.includes(realization));
    }

    return realizationsIntersection;
}
