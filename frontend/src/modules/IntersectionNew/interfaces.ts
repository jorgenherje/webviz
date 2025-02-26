import { InterfaceInitialization } from "@framework/UniDirectionalModuleComponentsInterface";
import { IntersectionSelection } from "@modules/_shared/components/IntersectionSelector/intersectionSelector";

import { layerManagerAtom, preferredViewLayoutAtom } from "./settings/atoms/baseAtoms";
import { selectedFieldIdentifierAtom, selectedIntersectionSelectionAtom } from "./settings/atoms/derivedAtoms";
import { PreferredViewLayout } from "./typesAndEnums";

import { LayerManager } from "../_shared/LayerFramework/framework/LayerManager/LayerManager";

export type SettingsToViewInterface = {
    layerManager: LayerManager | null;
    preferredViewLayout: PreferredViewLayout;
    fieldIdentifier: string | null;
    intersectionSelection: IntersectionSelection | null;
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
};
