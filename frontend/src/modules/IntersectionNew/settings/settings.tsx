import React from "react";

import type { ModuleSettingsProps } from "@framework/Module";
import { useEnsembleSet } from "@framework/WorkbenchSession";
import { FieldDropdown } from "@framework/components/FieldDropdown";
import { CollapsibleGroup } from "@lib/components/CollapsibleGroup";
import { Label } from "@lib/components/Label";
import { GroupDelegateTopic } from "@modules/_shared/LayerFramework/delegates/GroupDelegate";
import {
    DataLayerManager,
    LayerManagerTopic,
} from "@modules/_shared/LayerFramework/framework/DataLayerManager/DataLayerManager";
import { useQueryClient } from "@tanstack/react-query";

import { useAtom, useAtomValue, useSetAtom } from "jotai";

import { dataLayerManagerAtom, preferredViewLayoutAtom, userSelectedFieldIdentifierAtom } from "./atoms/baseAtoms";
import { selectedFieldIdentifierAtom } from "./atoms/derivedAtoms";
import { LayerManagerComponentWrapper } from "./components/layerManagerComponentWrapper";

import type { Interfaces } from "../interfaces";

export function Settings(props: ModuleSettingsProps<Interfaces>): JSX.Element {
    const ensembleSet = useEnsembleSet(props.workbenchSession);
    const queryClient = useQueryClient();

    const [dataLayerManager, setLayerManager] = useAtom(dataLayerManagerAtom);

    const selectedFieldIdentifier = useAtomValue(selectedFieldIdentifierAtom);
    const setSelectedFieldIdentifier = useSetAtom(userSelectedFieldIdentifierAtom);
    const [preferredViewLayout, setPreferredViewLayout] = useAtom(preferredViewLayoutAtom);

    const persistState = React.useCallback(
        function persistLayerManagerState() {
            if (!dataLayerManager) {
                return;
            }

            const serializedState = {
                layerManager: dataLayerManager.serializeState(),
                selectedFieldIdentifier,
                preferredViewLayout,
            };
            window.localStorage.setItem(
                `${props.settingsContext.getInstanceIdString()}-settings`,
                JSON.stringify(serializedState),
            );
        },
        [dataLayerManager, selectedFieldIdentifier, preferredViewLayout, props.settingsContext],
    );

    const applyPersistedState = React.useCallback(
        function applyPersistedState(layerManager: DataLayerManager) {
            const serializedState = window.localStorage.getItem(
                `${props.settingsContext.getInstanceIdString()}-settings`,
            );
            if (!serializedState) {
                return;
            }

            const parsedState = JSON.parse(serializedState);
            if (parsedState.fieldIdentifier) {
                setSelectedFieldIdentifier(parsedState.fieldIdentifier);
            }
            if (parsedState.preferredViewLayout) {
                setPreferredViewLayout(parsedState.preferredViewLayout);
            }

            if (parsedState.layerManager) {
                if (!layerManager) {
                    return;
                }
                layerManager.deserializeState(parsedState.layerManager);
            }
        },
        [setSelectedFieldIdentifier, setPreferredViewLayout, props.settingsContext],
    );

    React.useEffect(
        function onMountEffect() {
            const newLayerManager = new DataLayerManager(props.workbenchSession, props.workbenchSettings, queryClient);
            setLayerManager(newLayerManager);

            applyPersistedState(newLayerManager);

            return function onUnmountEffect() {
                newLayerManager.beforeDestroy();
            };
        },
        [setLayerManager, props.workbenchSession, props.workbenchSettings, queryClient, applyPersistedState],
    );

    React.useEffect(
        function onLayerManagerChangeEffect() {
            if (!dataLayerManager) {
                return;
            }

            persistState();

            const unsubscribeDataRev = dataLayerManager
                .getPublishSubscribeDelegate()
                .makeSubscriberFunction(LayerManagerTopic.LAYER_DATA_REVISION)(persistState);

            const unsubscribeExpands = dataLayerManager
                .getGroupDelegate()
                .getPublishSubscribeDelegate()
                .makeSubscriberFunction(GroupDelegateTopic.CHILDREN_EXPANSION_STATES)(persistState);

            return function onUnmountEffect() {
                dataLayerManager.beforeDestroy();
                unsubscribeDataRev();
                unsubscribeExpands();
            };
        },
        [dataLayerManager, props.workbenchSession, props.workbenchSettings, persistState],
    );

    React.useEffect(
        function onFieldIdentifierChangedEffect() {
            if (!dataLayerManager) {
                return;
            }
            dataLayerManager.updateGlobalSetting("fieldId", selectedFieldIdentifier);
        },
        [selectedFieldIdentifier, dataLayerManager],
    );

    function handleFieldIdentifierChange(fieldIdentifier: string | null) {
        setSelectedFieldIdentifier(fieldIdentifier);
    }

    return (
        <div className="h-full flex flex-col gap-1">
            <CollapsibleGroup title="Intersection" expanded>
                <Label text="Field">
                    <FieldDropdown
                        ensembleSet={ensembleSet}
                        value={selectedFieldIdentifier}
                        onChange={handleFieldIdentifierChange}
                    />
                </Label>
            </CollapsibleGroup>
            {dataLayerManager && (
                <LayerManagerComponentWrapper
                    dataLayerManager={dataLayerManager}
                    workbenchSession={props.workbenchSession}
                    workbenchSettings={props.workbenchSettings}
                />
            )}
        </div>
    );
}
