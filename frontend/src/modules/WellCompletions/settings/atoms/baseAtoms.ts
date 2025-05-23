import { SortDirection, SortWellsBy } from "@webviz/well-completions-plot";
import { atom } from "jotai";

import type { RegularEnsembleIdent } from "@framework/RegularEnsembleIdent";
import type { ColorSet } from "@lib/utils/ColorSet";
import { RealizationSelection, TimeAggregationSelection } from "@modules/WellCompletions/typesAndEnums";


export const syncedEnsembleIdentsAtom = atom<RegularEnsembleIdent[] | null>(null);
export const selectedStratigraphyColorSetAtom = atom<ColorSet | null>(null);
export const userExcludeWellTextAtom = atom<string>("");
export const userSearchWellTextAtom = atom<string>("");
export const userSelectedCompletionDateIndexAtom = atom<number>(0);
export const userSelectedCompletionDateIndexRangeAtom = atom<[number, number]>([0, 0]);
export const userSelectedTimeAggregationAtom = atom<TimeAggregationSelection>(TimeAggregationSelection.NONE);
export const userSelectedHideZeroCompletionsAtom = atom<boolean>(false);
export const userSelectedEnsembleIdentAtom = atom<RegularEnsembleIdent | null>(null);
export const userSelectedRealizationNumberAtom = atom<number | null>(null);
export const userSelectedRealizationSelectionAtom = atom<RealizationSelection>(RealizationSelection.AGGREGATED);
export const userSelectedSortWellsByAtom = atom<SortWellsBy>(SortWellsBy.WELL_NAME);
export const userSelectedSortWellsDirectionAtom = atom<SortDirection>(SortDirection.ASCENDING);
