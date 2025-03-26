import { InterfaceInitialization } from "@framework/UniDirectionalModuleComponentsInterface";
import { IntersectionSelection } from "@modules/_shared/components/IntersectionSelector/intersectionSelector";

import { layerManagerAtom, preferredViewLayoutAtom } from "./settings/atoms/baseAtoms";
import {
    selectedFieldIdentifierAtom,
    selectedIntersectionSelectionAtom,
    selectedWellboreHeaderAtom,
} from "./settings/atoms/derivedAtoms";
import { PreferredViewLayout, WellboreHeader } from "./typesAndEnums";

import { LayerManager } from "../_shared/LayerFramework/framework/LayerManager/LayerManager";

export type SettingsToViewInterface = {
    layerManager: LayerManager | null;
    preferredViewLayout: PreferredViewLayout;
    fieldIdentifier: string | null;
    intersectionSelection: IntersectionSelection | null;
    wellboreHeader: WellboreHeader | null;
};

export type Interfaces = {
    settingsToView: SettingsToViewInterface;
};

export const settingsToViewInterfaceInitialization: InterfaceInitialization<SettingsToViewInterface> = {
    layerManager: (get) => {
        return get(layerManagerAtom);
    },
    preferredViewLayout: (get) => {
        return get(preferredViewLayoutAtom);
    },
    fieldIdentifier: (get) => {
        return get(selectedFieldIdentifierAtom);
    },
    intersectionSelection: (get) => {
        return get(selectedIntersectionSelectionAtom);
    },
    wellboreHeader: (get) => {
        return get(selectedWellboreHeaderAtom);
    },
};
