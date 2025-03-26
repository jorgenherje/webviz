import { InterfaceEffects } from "@framework/Module";
import { SettingsToViewInterface } from "@modules/IntersectionNew/interfaces";

import { selectedFieldIdentifierAtom, selectedIntersectionSelectionAtom } from "./baseAtoms";

export const settingsToViewInterfaceEffects: InterfaceEffects<SettingsToViewInterface> = [
    (getInterfaceValue, setAtomValue) => {
        const fieldIdentifier = getInterfaceValue("fieldIdentifier");
        setAtomValue(selectedFieldIdentifierAtom, fieldIdentifier);
    },
    (getInterfaceValue, setAtomValue) => {
        const intersectionSelection = getInterfaceValue("intersectionSelection");
        setAtomValue(selectedIntersectionSelectionAtom, intersectionSelection);
    },
];
