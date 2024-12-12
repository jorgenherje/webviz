import { ParameterIdent } from "@framework/EnsembleParameters";
import { atomWithCompare } from "@framework/utils/atomUtils";
import { ParameterDistributionPlotType } from "@modules/ParameterDistributionMatrix/typesAndEnums";

import { atom } from "jotai";
import { isEqual } from "lodash";

export const selectedVisualizationTypeAtom = atom<ParameterDistributionPlotType>(
    ParameterDistributionPlotType.DISTRIBUTION_PLOT
);
export const showIndividualRealizationValuesAtom = atom<boolean>(false);
export const showPercentilesAndMeanLinesAtom = atom<boolean>(false);

export const userSelectedEnsembleIdentsAtom = atomWithCompare<string[]>([], isEqual);
export const userSelectedParameterIdentsAtom = atom<ParameterIdent[]>([]);
export const showConstantParametersAtom = atom<boolean>(false);
