import type { InterfaceEffects } from "@framework/Module";
import type { SettingsToViewInterface } from "@modules/WellLogViewer/interfaces";

import { lockQueriesAtom, selectedFieldIdentAtom, wellboreHeaderAtom } from "./baseAtoms";

export const settingsToViewInterfaceEffects: InterfaceEffects<SettingsToViewInterface> = [
    (getInterfaceValue, setAtomValue) => {
        // ! Derived atoms will fire between each `setAtomValue` call, it seems (See: issue #846).
        // ! Setting them both to null to avoid query atoms firing with invalid vals
        // Lock queries until all effects are done
        setAtomValue(lockQueriesAtom, true);

        const wellboreUuid = getInterfaceValue("wellboreHeader");
        const selectedField = getInterfaceValue("selectedField");

        setAtomValue(selectedFieldIdentAtom, selectedField);
        setAtomValue(wellboreHeaderAtom, wellboreUuid);

        setAtomValue(lockQueriesAtom, false);
    },
];
