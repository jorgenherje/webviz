import { atom } from "jotai";

import type { ParameterIdent } from "@framework/EnsembleParameters";
import type { RegularEnsembleIdent } from "@framework/RegularEnsembleIdent";
import { atomWithCompare } from "@framework/utils/atomUtils";
import { areEnsembleIdentListsEqual } from "@framework/utils/ensembleIdentUtils";
import { ParameterDistributionPlotType } from "@modules/ParameterDistributionMatrix/typesAndEnums";


export const selectedVisualizationTypeAtom = atom<ParameterDistributionPlotType>(
    ParameterDistributionPlotType.DISTRIBUTION_PLOT,
);
export const showIndividualRealizationValuesAtom = atom<boolean>(false);
export const showPercentilesAndMeanLinesAtom = atom<boolean>(false);

export const userSelectedEnsembleIdentsAtom = atomWithCompare<RegularEnsembleIdent[]>([], areEnsembleIdentListsEqual);
export const userSelectedParameterIdentsAtom = atom<ParameterIdent[]>([]);
export const showConstantParametersAtom = atom<boolean>(false);
