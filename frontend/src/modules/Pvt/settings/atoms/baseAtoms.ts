import { atomWithCompare } from "@framework/utils/atomUtils";
import { ColorBy, PhaseType, PressureDependentVariable } from "@modules/Pvt/typesAndEnums";

import { atom } from "jotai";
import { isEqual } from "lodash";

export const selectedPhaseAtom = atom<PhaseType>(PhaseType.OIL);
export const selectedColorByAtom = atom<ColorBy>(ColorBy.ENSEMBLE);
export const selectedDependentVariablesAtom = atom<PressureDependentVariable[]>([
    PressureDependentVariable.FORMATION_VOLUME_FACTOR,
    PressureDependentVariable.DENSITY,
    PressureDependentVariable.VISCOSITY,
    PressureDependentVariable.FLUID_RATIO,
]);

export const userSelectedEnsembleIdentsAtom = atomWithCompare<string[]>([], isEqual);
export const userSelectedRealizationsAtom = atomWithCompare<number[]>([], isEqual);
export const userSelectedPvtNumsAtom = atomWithCompare<number[]>([], isEqual);
