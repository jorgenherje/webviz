import React from "react";

import { ModuleViewProps } from "@framework/Module";

import { useAtomValue } from "jotai";

import {
    intersectionReferenceSystemAtom,
    selectedIntersectionTypeAtom,
    wellboreCasinDataAtom,
} from "./atoms/derivedAtoms";
import { LayersWrapper } from "./components/LayersWrapper";

import { Interfaces } from "../interfaces";

export function View(props: ModuleViewProps<Interfaces>): React.ReactNode {
    const preferredViewLayout = props.viewContext.useSettingsToViewInterfaceValue("preferredViewLayout");
    const layerManager = props.viewContext.useSettingsToViewInterfaceValue("layerManager");
    const wellboreHeader = props.viewContext.useSettingsToViewInterfaceValue("wellboreHeader");
    const intersectionType = useAtomValue(selectedIntersectionTypeAtom);
    const intersectionReferenceSystem = useAtomValue(intersectionReferenceSystemAtom);
    const wellboreCasingData = useAtomValue(wellboreCasinDataAtom);

    if (!layerManager) {
        return null;
    }

    return (
        <LayersWrapper
            layerManager={layerManager}
            preferredViewLayout={preferredViewLayout}
            intersectionReferenceSystem={intersectionReferenceSystem}
            intersectionType={intersectionType}
            wellboreHeader={wellboreHeader}
            wellboreCasingData={wellboreCasingData}
            viewContext={props.viewContext}
            workbenchSession={props.workbenchSession}
            workbenchSettings={props.workbenchSettings}
            workbenchServices={props.workbenchServices}
        />
    );
}
