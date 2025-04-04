import type { InterfaceInitialization } from "@framework/UniDirectionalModuleComponentsInterface";

import { dataLayerManagerAtom, preferredViewLayoutAtom } from "./settings/atoms/baseAtoms";
import type { PreferredViewLayout } from "./typesAndEnums";

import type { DataLayerManager } from "../_shared/LayerFramework/framework/DataLayerManager/DataLayerManager";

export type SettingsToViewInterface = {
    dataLayerManager: DataLayerManager | null;
    preferredViewLayout: PreferredViewLayout;
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
};
