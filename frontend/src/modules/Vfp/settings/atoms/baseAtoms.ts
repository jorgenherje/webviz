import { PressureOption, VfpParam } from "@modules/Vfp/types";

import { atom } from "jotai";

export const userSelectedRealizationNumberAtom = atom<number | null>(null);

export const validRealizationNumbersAtom = atom<number[] | null>(null);

export const userSelectedEnsembleIdentAtom = atom<string | null>(null);

export const userSelectedVfpTableNameAtom = atom<string | null>(null);

export const userSelectedThpIndicesAtom = atom<number[] | null>(null);

export const userSelectedWfrIndicesAtom = atom<number[] | null>(null);

export const userSelectedGfrIndicesAtom = atom<number[] | null>(null);

export const userSelectedAlqIndicesAtom = atom<number[] | null>(null);

export const userSelectedPressureOptionAtom = atom<PressureOption | null>(null);

export const userSelectedColorByAtom = atom<VfpParam | null>(null);
