import { atom } from "jotai";
import { isEqual } from "lodash";

import { Frequency_api, StatisticFunction_api } from "@api";
import type { DeltaEnsembleIdent } from "@framework/DeltaEnsembleIdent";
import type { ParameterIdent } from "@framework/EnsembleParameters";
import type { RegularEnsembleIdent } from "@framework/RegularEnsembleIdent";
import { atomWithCompare } from "@framework/utils/atomUtils";
import { areEnsembleIdentListsEqual } from "@framework/utils/ensembleIdentUtils";

import type { StatisticsSelection } from "../../typesAndEnums";
import { FanchartStatisticOption, GroupBy, SubplotLimitDirection, VisualizationMode } from "../../typesAndEnums";

export const resampleFrequencyAtom = atom<Frequency_api | null>(Frequency_api.MONTHLY);

export const groupByAtom = atom<GroupBy>(GroupBy.TIME_SERIES);

export const subplotLimitDirectionAtom = atom<SubplotLimitDirection>(SubplotLimitDirection.NONE);

export const subplotMaxDirectionElementsAtom = atom<number>(3);

export const colorRealizationsByParameterAtom = atom<boolean>(false);

export const visualizationModeAtom = atom<VisualizationMode>(VisualizationMode.STATISTICAL_FANCHART);

export const showHistoricalAtom = atom<boolean>(false);

export const showObservationsAtom = atom<boolean>(true);

export const statisticsSelectionAtom = atom<StatisticsSelection>({
    IndividualStatisticsSelection: Object.values(StatisticFunction_api),
    FanchartStatisticsSelection: Object.values(FanchartStatisticOption),
});

export const userSelectedEnsembleIdentsAtom = atomWithCompare<(RegularEnsembleIdent | DeltaEnsembleIdent)[]>(
    [],
    areEnsembleIdentListsEqual,
);

export const selectedVectorNamesAtom = atomWithCompare<string[]>([], isEqual);

export const filteredParameterIdentListAtom = atom<ParameterIdent[]>([]);

export const userSelectedParameterIdentStringAtom = atom<string | null>(null);

export const userSelectedActiveTimestampUtcMsAtom = atom<number | null>(null);
