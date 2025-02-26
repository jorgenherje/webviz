import React from "react";

import { ModuleViewProps } from "@framework/Module";

import { useAtomValue } from "jotai";

import { intersectionReferenceSystemAtom, selectedWellboreHeaderUuidAtom } from "./atoms/derivedAtoms";
import { LayersWrapper } from "./components/LayersWrapper";

import { Interfaces } from "../interfaces";

export function View(props: ModuleViewProps<Interfaces>): React.ReactNode {
    const preferredViewLayout = props.viewContext.useSettingsToViewInterfaceValue("preferredViewLayout");
    const layerManager = props.viewContext.useSettingsToViewInterfaceValue("layerManager");
    const intersectionReferenceSystem = useAtomValue(intersectionReferenceSystemAtom);
    const wellboreHeaderUuid = useAtomValue(selectedWellboreHeaderUuidAtom);

    if (!layerManager) {
        return null;
    }

    return (
        <LayersWrapper
            layerManager={layerManager}
            preferredViewLayout={preferredViewLayout}
            intersectionReferenceSystem={intersectionReferenceSystem}
            wellboreHeaderUuid={wellboreHeaderUuid}
            viewContext={props.viewContext}
            workbenchSession={props.workbenchSession}
            workbenchSettings={props.workbenchSettings}
            workbenchServices={props.workbenchServices}
        />
    );
}
