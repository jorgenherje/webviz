import React from "react";

import { ModuleViewProps } from "@framework/Module";

import { useAtomValue } from "jotai";

// import { intersectionReferenceSystemAtom, wellboreCasingDataAtom } from "./atoms/derivedAtoms";
import { DataLayersWrapper } from "./components/DataLayersWrapper";

import { Interfaces } from "../interfaces";

export function View(props: ModuleViewProps<Interfaces>): React.ReactNode {
    const preferredViewLayout = props.viewContext.useSettingsToViewInterfaceValue("preferredViewLayout");
    const dataLayerManager = props.viewContext.useSettingsToViewInterfaceValue("dataLayerManager");
    // const intersectionReferenceSystem = useAtomValue(intersectionReferenceSystemAtom);
    // const wellboreCasingData = useAtomValue(wellboreCasingDataAtom);

    if (!dataLayerManager) {
        return null;
    }

    return (
        <DataLayersWrapper
            layerManager={dataLayerManager}
            preferredViewLayout={preferredViewLayout}
            // intersectionReferenceSystem={intersectionReferenceSystem}
            // intersectionType={intersectionType}
            // wellboreHeader={wellboreHeader}
            // wellboreCasingData={wellboreCasingData}
            viewContext={props.viewContext}
            workbenchSession={props.workbenchSession}
            workbenchSettings={props.workbenchSettings}
            workbenchServices={props.workbenchServices}
        />
    );
}
