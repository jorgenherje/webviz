import { InterfaceEffects } from "@framework/Module";
import { SettingsToViewInterface } from "@modules/IntersectionNew/interfaces";

import { selectedFieldIdentifierAtom } from "./baseAtoms";

export const settingsToViewInterfaceEffects: InterfaceEffects<SettingsToViewInterface> = [
    (getInterfaceValue, setAtomValue) => {
        const fieldIdentifier = getInterfaceValue("fieldIdentifier");
        setAtomValue(selectedFieldIdentifierAtom, fieldIdentifier);
    },
];
