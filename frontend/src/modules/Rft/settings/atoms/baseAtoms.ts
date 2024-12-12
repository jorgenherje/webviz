import { atom } from "jotai";

export const userSelectedEnsembleIdentAtom = atom<string | null>(null);
export const validRealizationNumbersAtom = atom<number[] | null>(null);
export const userSelectedResponseNameAtom = atom<string | null>(null);
export const userSelectedWellNameAtom = atom<string | null>(null);
export const userSelectedRftTimestampsUtcMsAtom = atom<number | null>(null);
