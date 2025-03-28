import { InterfaceInitialization } from "@framework/UniDirectionalModuleComponentsInterface";

import { dataLayerManagerAtom, preferredViewLayoutAtom } from "./settings/atoms/baseAtoms";
import { selectedFieldIdentifierAtom } from "./settings/atoms/derivedAtoms";
import { PreferredViewLayout } from "./typesAndEnums";

import { DataLayerManager } from "../_shared/LayerFramework/framework/DataLayerManager/DataLayerManager";

export type SettingsToViewInterface = {
    dataLayerManager: DataLayerManager | null;
    preferredViewLayout: PreferredViewLayout;
    fieldIdentifier: string | null;
};

export type Interfaces = {
    settingsToView: SettingsToViewInterface;
};

export const settingsToViewInterfaceInitialization: InterfaceInitialization<SettingsToViewInterface> = {
    dataLayerManager: (get) => {
        return get(dataLayerManagerAtom);
    },
    preferredViewLayout: (get) => {
        return get(preferredViewLayoutAtom);
    },
    fieldIdentifier: (get) => {
        return get(selectedFieldIdentifierAtom);
    },
};
