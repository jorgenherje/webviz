import React from "react";

import { ModuleSettingsProps } from "@framework/Module";
import { useEnsembleSet } from "@framework/WorkbenchSession";
import { FieldDropdown } from "@framework/components/FieldDropdown";
import { CollapsibleGroup } from "@lib/components/CollapsibleGroup";
import { Label } from "@lib/components/Label";
import { PendingWrapper } from "@lib/components/PendingWrapper";
import { GroupDelegateTopic } from "@modules/_shared/LayerFramework/delegates/GroupDelegate";
import { LayerManager, LayerManagerTopic } from "@modules/_shared/LayerFramework/framework/LayerManager/LayerManager";
import {
    IntersectionSelection,
    IntersectionSelector,
} from "@modules/_shared/components/IntersectionSelector/intersectionSelector";
import { useQueryClient } from "@tanstack/react-query";

import { useAtom, useAtomValue, useSetAtom } from "jotai";

import {
    layerManagerAtom,
    preferredViewLayoutAtom,
    userSelectedFieldIdentifierAtom,
    userSelectedIntersectionSelectionAtom,
} from "./atoms/baseAtoms";
import {
    availableIntersectionSelectionsAtom,
    hasErrorAvailableWellboreHeadersAtom,
    isFetchingAvailableWellboreHeadersAtom,
    selectedFieldIdentifierAtom,
    selectedIntersectionSelectionAtom,
} from "./atoms/derivedAtoms";
import { LayerManagerComponentWrapper } from "./components/layerManagerComponentWrapper";

import { Interfaces } from "../interfaces";

export function Settings(props: ModuleSettingsProps<Interfaces>): JSX.Element {
    const ensembleSet = useEnsembleSet(props.workbenchSession);
    const queryClient = useQueryClient();

    const [layerManager, setLayerManager] = useAtom(layerManagerAtom);

    const selectedFieldIdentifier = useAtomValue(selectedFieldIdentifierAtom);
    const setSelectedFieldIdentifier = useSetAtom(userSelectedFieldIdentifierAtom);
    const isFetchingAvailableWellboreHeaders = useAtomValue(isFetchingAvailableWellboreHeadersAtom);
    const hasErrorAvailableWellboreHeaders = useAtomValue(hasErrorAvailableWellboreHeadersAtom);
    const availableIntersectionSelections = useAtomValue(availableIntersectionSelectionsAtom);
    const selectedIntersectionSelectorValue = useAtomValue(selectedIntersectionSelectionAtom);
    const setSelectedIntersectionSelectorValue = useSetAtom(userSelectedIntersectionSelectionAtom);
    const [preferredViewLayout, setPreferredViewLayout] = useAtom(preferredViewLayoutAtom);

    const persistState = React.useCallback(
        function persistLayerManagerState() {
            if (!layerManager) {
                return;
            }

            const serializedState = {
                layerManager: layerManager.serializeState(),
                selectedFieldIdentifier,
                preferredViewLayout,
            };
            window.localStorage.setItem(
                `${props.settingsContext.getInstanceIdString()}-settings`,
                JSON.stringify(serializedState)
            );
        },
        [layerManager, selectedFieldIdentifier, preferredViewLayout, props.settingsContext]
    );

    const applyPersistedState = React.useCallback(
        function applyPersistedState(layerManager: LayerManager) {
            const serializedState = window.localStorage.getItem(
                `${props.settingsContext.getInstanceIdString()}-settings`
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
        [setSelectedFieldIdentifier, setPreferredViewLayout, props.settingsContext]
    );

    React.useEffect(
        function onMountEffect() {
            const newLayerManager = new LayerManager(props.workbenchSession, props.workbenchSettings, queryClient);
            setLayerManager(newLayerManager);

            applyPersistedState(newLayerManager);

            return function onUnmountEffect() {
                newLayerManager.beforeDestroy();
            };
        },
        [setLayerManager, props.workbenchSession, props.workbenchSettings, queryClient, applyPersistedState]
    );

    React.useEffect(
        function onLayerManagerChangeEffect() {
            if (!layerManager) {
                return;
            }

            persistState();

            const unsubscribeDataRev = layerManager
                .getPublishSubscribeDelegate()
                .makeSubscriberFunction(LayerManagerTopic.LAYER_DATA_REVISION)(persistState);

            const unsubscribeExpands = layerManager
                .getGroupDelegate()
                .getPublishSubscribeDelegate()
                .makeSubscriberFunction(GroupDelegateTopic.CHILDREN_EXPANSION_STATES)(persistState);

            return function onUnmountEffect() {
                layerManager.beforeDestroy();
                unsubscribeDataRev();
                unsubscribeExpands();
            };
        },
        [layerManager, props.workbenchSession, props.workbenchSettings, persistState]
    );

    React.useEffect(
        function onFieldIdentifierChangedEffect() {
            if (!layerManager) {
                return;
            }
            layerManager.updateGlobalSetting("fieldId", selectedFieldIdentifier);
        },
        [selectedFieldIdentifier, layerManager]
    );

    React.useEffect(
        function onFieldIdentifierChangedEffect() {
            if (!layerManager) {
                return;
            }

            layerManager.updateGlobalSetting("intersectionSelection", selectedIntersectionSelectorValue);
        },
        [selectedIntersectionSelectorValue, layerManager]
    );

    function handleFieldIdentifierChange(fieldIdentifier: string | null) {
        setSelectedFieldIdentifier(fieldIdentifier);
    }

    function handleIntersectionSelectorChange(value: IntersectionSelection | null) {
        setSelectedIntersectionSelectorValue(value);
    }

    return (
        <div className="h-full flex flex-col gap-1">
            <CollapsibleGroup title="Intersection" expanded>
                <div className="flex flex-col gap-4 text-sm mb-4">
                    <Label text="Field">
                        <FieldDropdown
                            ensembleSet={ensembleSet}
                            value={selectedFieldIdentifier}
                            onChange={handleFieldIdentifierChange}
                        />
                    </Label>
                    <PendingWrapper
                        isPending={isFetchingAvailableWellboreHeaders}
                        errorMessage={hasErrorAvailableWellboreHeaders ? "Error loading wellbore headers" : undefined}
                    >
                        <IntersectionSelector
                            value={selectedIntersectionSelectorValue}
                            availableValues={availableIntersectionSelections}
                            onValueChange={handleIntersectionSelectorChange}
                        />
                    </PendingWrapper>
                </div>
            </CollapsibleGroup>
            {layerManager && (
                <LayerManagerComponentWrapper
                    layerManager={layerManager}
                    workbenchSession={props.workbenchSession}
                    workbenchSettings={props.workbenchSettings}
                />
            )}
        </div>
    );
}
