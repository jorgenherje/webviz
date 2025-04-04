import type React from "react";

import type { ModuleViewProps } from "@framework/Module";

import { DataLayersWrapper } from "./components/DataLayersWrapper";

import type { Interfaces } from "../interfaces";

export function View(props: ModuleViewProps<Interfaces>): React.ReactNode {
    const preferredViewLayout = props.viewContext.useSettingsToViewInterfaceValue("preferredViewLayout");
    const dataLayerManager = props.viewContext.useSettingsToViewInterfaceValue("dataLayerManager");

    if (!dataLayerManager) {
        return null;
    }

    return (
        <DataLayersWrapper
            layerManager={dataLayerManager}
            preferredViewLayout={preferredViewLayout}
            viewContext={props.viewContext}
            workbenchSession={props.workbenchSession}
            workbenchSettings={props.workbenchSettings}
            workbenchServices={props.workbenchServices}
        />
    );
}
