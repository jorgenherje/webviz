import React from "react";

import {
    GuiEvent,
    GuiEventPayloads,
    GuiState,
    RightDrawerContent,
    useGuiState,
    useGuiValue,
} from "@framework/GuiMessageBroker";
import { Workbench } from "@framework/Workbench";
import { useEnsembleSet } from "@framework/WorkbenchSession";
import { Drawer } from "@framework/internal/components/Drawer";
import {
    EnsembleRealizationFilter,
    EnsembleRealizationFilterSelections,
} from "@framework/internal/components/EnsembleRealizationFilter";
import { UnsavedChangesAction } from "@framework/types/unsavedChangesAction";
import { countTrueValues } from "@framework/utils/objectUtils";
import { areParameterIdentStringToValueSelectionMapCandidatesEqual } from "@framework/utils/realizationFilterTypesUtils";
import { FilterAlt } from "@mui/icons-material";

import { isEqual } from "lodash";

export type RealizationFilterSettingsProps = { workbench: Workbench; onClose: () => void };

export const RealizationFilterSettings: React.FC<RealizationFilterSettingsProps> = (props) => {
    const guiMessageBroker = props.workbench.getGuiMessageBroker();
    const drawerContent = useGuiValue(guiMessageBroker, GuiState.RightDrawerContent);
    const rightSettingsPanelWidth = useGuiValue(guiMessageBroker, GuiState.RightSettingsPanelWidthInPercent);
    const ensembleSet = useEnsembleSet(props.workbench.getWorkbenchSession());
    const realizationFilterSet = props.workbench.getWorkbenchSession().getRealizationFilterSet();
    const [, setNumberOfUnsavedRealizationFilters] = useGuiState(
        guiMessageBroker,
        GuiState.NumberOfUnsavedRealizationFilters
    );

    const [activeFilterEnsembleIdent, setActiveFilterEnsembleIdent] = React.useState<string | null>(null);

    // Maps for keeping track of unsaved changes and filter selections
    const [ensembleIdentHasUnsavedChangesMap, setEnsembleIdentHasUnsavedChangesMap] = React.useState<{
        [ensembleIdent: string]: boolean;
    }>({});
    const [ensembleIdentToRealizationFilterSelectionsMap, setEnsembleIdentToRealizationFilterSelectionsMap] =
        React.useState<{
            [ensembleIdent: string]: EnsembleRealizationFilterSelections;
        }>({});

    // Set no active filter if the settings panel is closed
    if (rightSettingsPanelWidth < 5 && activeFilterEnsembleIdent !== null) {
        setActiveFilterEnsembleIdent(null);
    }

    // Create new maps if ensembles are added or removed
    const ensembleIdents = ensembleSet.getEnsembleArray().map((ensemble) => ensemble.getIdent());
    if (!isEqual(ensembleIdents, Object.keys(ensembleIdentToRealizationFilterSelectionsMap))) {
        // Create new maps with the new ensemble ident strings
        const updatedHasUnsavedChangesMap: { [ensembleIdent: string]: boolean } = {
            ...ensembleIdentHasUnsavedChangesMap,
        };
        const updatedSelectionsMap: { [ensembleIdent: string]: EnsembleRealizationFilterSelections } = {
            ...ensembleIdentToRealizationFilterSelectionsMap,
        };

        // Delete non-existing ensemble ident strings
        for (const ensembleIdent of Object.keys(ensembleIdentToRealizationFilterSelectionsMap)) {
            if (!ensembleIdents.includes(ensembleIdent)) {
                delete updatedHasUnsavedChangesMap[ensembleIdent];
                delete updatedSelectionsMap[ensembleIdent];
            }
        }

        for (const ensembleIdent of ensembleIdents) {
            if (ensembleIdent in updatedSelectionsMap) {
                // Skip if already exists
                continue;
            }

            const realizationFilter = realizationFilterSet.getRealizationFilterForEnsembleIdent(ensembleIdent);

            updatedHasUnsavedChangesMap[ensembleIdent] = false;
            updatedSelectionsMap[ensembleIdent] = {
                displayRealizationNumbers: realizationFilter.getFilteredRealizations(),
                realizationNumberSelections: realizationFilter.getRealizationNumberSelections(),
                parameterIdentStringToValueSelectionReadonlyMap:
                    realizationFilter.getParameterIdentStringToValueSelectionReadonlyMap(),
                filterType: realizationFilter.getFilterType(),
                includeOrExcludeFilter: realizationFilter.getIncludeOrExcludeFilter(),
            };
        }
        setEnsembleIdentHasUnsavedChangesMap(updatedHasUnsavedChangesMap);
        setEnsembleIdentToRealizationFilterSelectionsMap(updatedSelectionsMap);
        setNumberOfUnsavedRealizationFilters(countTrueValues(updatedHasUnsavedChangesMap));
    }

    const handleApplyAllClick = React.useCallback(
        function handleApplyAllClick() {
            // Apply all the unsaved changes state and reset the unsaved changes state
            const resetHasUnsavedChangesMap: { [ensembleIdent: string]: boolean } = {};
            for (const ensembleIdent in ensembleIdentToRealizationFilterSelectionsMap) {
                const realizationFilter = realizationFilterSet.getRealizationFilterForEnsembleIdent(ensembleIdent);
                const selections = ensembleIdentToRealizationFilterSelectionsMap[ensembleIdent];

                // Apply the filter changes
                realizationFilter.setFilterType(selections.filterType);
                realizationFilter.setIncludeOrExcludeFilter(selections.includeOrExcludeFilter);
                realizationFilter.setRealizationNumberSelections(selections.realizationNumberSelections);
                realizationFilter.setParameterIdentStringToValueSelectionReadonlyMap(
                    selections.parameterIdentStringToValueSelectionReadonlyMap
                );

                // Run filtering
                realizationFilter.runFiltering();

                // Reset the unsaved changes state
                resetHasUnsavedChangesMap[ensembleIdent] = false;
            }

            setEnsembleIdentHasUnsavedChangesMap(resetHasUnsavedChangesMap);
            setNumberOfUnsavedRealizationFilters(0);

            // Notify subscribers of change.
            props.workbench.getWorkbenchSession().notifyAboutEnsembleRealizationFilterChange();
        },
        [
            ensembleIdentToRealizationFilterSelectionsMap,
            realizationFilterSet,
            setNumberOfUnsavedRealizationFilters,
            props.workbench,
        ]
    );

    const handleDiscardAllClick = React.useCallback(
        function handleDiscardAllClick() {
            // Discard all filter changes - i.e. reset the unsaved changes state
            const resetSelectionsMap: { [ensembleIdent: string]: EnsembleRealizationFilterSelections } = {};
            const resetHasUnsavedChangesMap: { [ensembleIdent: string]: boolean } = {};
            for (const ensembleIdent in ensembleIdentToRealizationFilterSelectionsMap) {
                const realizationFilter = realizationFilterSet.getRealizationFilterForEnsembleIdent(ensembleIdent);

                resetSelectionsMap[ensembleIdent] = {
                    displayRealizationNumbers: realizationFilter.getFilteredRealizations(),
                    realizationNumberSelections: realizationFilter.getRealizationNumberSelections(),
                    parameterIdentStringToValueSelectionReadonlyMap:
                        realizationFilter.getParameterIdentStringToValueSelectionReadonlyMap(),
                    filterType: realizationFilter.getFilterType(),
                    includeOrExcludeFilter: realizationFilter.getIncludeOrExcludeFilter(),
                };
                resetHasUnsavedChangesMap[ensembleIdent] = false;
            }

            setEnsembleIdentToRealizationFilterSelectionsMap(resetSelectionsMap);
            setEnsembleIdentHasUnsavedChangesMap(resetHasUnsavedChangesMap);
            setNumberOfUnsavedRealizationFilters(0);
        },
        [ensembleIdentToRealizationFilterSelectionsMap, realizationFilterSet, setNumberOfUnsavedRealizationFilters]
    );

    React.useEffect(() => {
        function handleUnsavedChangesAction(
            payload: GuiEventPayloads[GuiEvent.UnsavedRealizationFilterSettingsAction]
        ) {
            if (payload.action === UnsavedChangesAction.Save) {
                handleApplyAllClick();
                setActiveFilterEnsembleIdent(null);
            } else if (payload.action === UnsavedChangesAction.Discard) {
                handleDiscardAllClick();
                setActiveFilterEnsembleIdent(null);
            }
        }

        const removeUnsavedChangesActionHandler = guiMessageBroker.subscribeToEvent(
            GuiEvent.UnsavedRealizationFilterSettingsAction,
            handleUnsavedChangesAction
        );

        return () => {
            removeUnsavedChangesActionHandler();
        };
    }, [guiMessageBroker, handleApplyAllClick, handleDiscardAllClick]);

    function handleFilterSettingsClose() {
        props.onClose();
    }

    function handleApplyClick(ensembleIdent: string) {
        const realizationFilter = realizationFilterSet.getRealizationFilterForEnsembleIdent(ensembleIdent);
        const selections = ensembleIdentToRealizationFilterSelectionsMap[ensembleIdent];

        // Apply the filter changes
        realizationFilter.setFilterType(selections.filterType);
        realizationFilter.setIncludeOrExcludeFilter(selections.includeOrExcludeFilter);
        realizationFilter.setRealizationNumberSelections(selections.realizationNumberSelections);
        realizationFilter.setParameterIdentStringToValueSelectionReadonlyMap(
            selections.parameterIdentStringToValueSelectionReadonlyMap
        );

        // Run filtering
        realizationFilter.runFiltering();

        // Reset the unsaved changes state
        const newHasUnsavedChangesMap = { ...ensembleIdentHasUnsavedChangesMap, [ensembleIdent]: false };
        setEnsembleIdentHasUnsavedChangesMap(newHasUnsavedChangesMap);
        setNumberOfUnsavedRealizationFilters(countTrueValues(newHasUnsavedChangesMap));

        // Notify subscribers of change.
        props.workbench.getWorkbenchSession().notifyAboutEnsembleRealizationFilterChange();
    }

    function handleDiscardClick(ensembleIdent: string) {
        const realizationFilter = realizationFilterSet.getRealizationFilterForEnsembleIdent(ensembleIdent);
        setEnsembleIdentToRealizationFilterSelectionsMap({
            ...ensembleIdentToRealizationFilterSelectionsMap,
            [ensembleIdent]: {
                displayRealizationNumbers: realizationFilter.getFilteredRealizations(),
                realizationNumberSelections: realizationFilter.getRealizationNumberSelections(),
                parameterIdentStringToValueSelectionReadonlyMap:
                    realizationFilter.getParameterIdentStringToValueSelectionReadonlyMap(),
                filterType: realizationFilter.getFilterType(),
                includeOrExcludeFilter: realizationFilter.getIncludeOrExcludeFilter(),
            },
        });

        // Reset the unsaved changes state
        const newHasUnsavedChangesMap = { ...ensembleIdentHasUnsavedChangesMap, [ensembleIdent]: false };
        setEnsembleIdentHasUnsavedChangesMap(newHasUnsavedChangesMap);
        setNumberOfUnsavedRealizationFilters(countTrueValues(newHasUnsavedChangesMap));
    }

    function handleFilterChange(ensembleIdent: string, selections: EnsembleRealizationFilterSelections) {
        // Register the filter changes in the map
        setEnsembleIdentToRealizationFilterSelectionsMap({
            ...ensembleIdentToRealizationFilterSelectionsMap,
            [ensembleIdent]: selections,
        });

        // Check if the filter changes are different from the original filter
        const realizationFilter = realizationFilterSet.getRealizationFilterForEnsembleIdent(ensembleIdent);
        const hasUnsavedChanges =
            !isEqual(selections.realizationNumberSelections, realizationFilter.getRealizationNumberSelections()) ||
            !areParameterIdentStringToValueSelectionMapCandidatesEqual(
                selections.parameterIdentStringToValueSelectionReadonlyMap,
                realizationFilter.getParameterIdentStringToValueSelectionReadonlyMap()
            ) ||
            selections.filterType !== realizationFilter.getFilterType() ||
            selections.includeOrExcludeFilter !== realizationFilter.getIncludeOrExcludeFilter();

        // Update the unsaved changes state
        const newHasUnsavedChangesMap = {
            ...ensembleIdentHasUnsavedChangesMap,
            [ensembleIdent]: hasUnsavedChanges,
        };
        setEnsembleIdentHasUnsavedChangesMap(newHasUnsavedChangesMap);
        setNumberOfUnsavedRealizationFilters(countTrueValues(newHasUnsavedChangesMap));
    }

    function handleSetActiveEnsembleRealizationFilter(ensembleIdent: string) {
        setActiveFilterEnsembleIdent(ensembleIdent);
    }

    function handleOnEnsembleRealizationFilterHeaderClick(ensembleIdent: string) {
        if (activeFilterEnsembleIdent === ensembleIdent) {
            setActiveFilterEnsembleIdent(null);
        }
    }

    return (
        <div className={`w-full ${drawerContent === RightDrawerContent.RealizationFilterSettings ? "h-full" : "h-0"}`}>
            <Drawer
                title="Realization Filter"
                icon={<FilterAlt />}
                visible={drawerContent === RightDrawerContent.RealizationFilterSettings}
                onClose={handleFilterSettingsClose}
            >
                <div className="flex flex-col p-2 gap-4 overflow-y-auto">
                    <div className="flex-grow space-y-4">
                        {ensembleSet.getEnsembleArray().map((ensemble) => {
                            const ensembleIdent = ensemble.getIdent();
                            const isActive = activeFilterEnsembleIdent === ensembleIdent;
                            const isAnotherActive = !isActive && activeFilterEnsembleIdent !== null;

                            const selections = ensembleIdentToRealizationFilterSelectionsMap[ensembleIdent];

                            if (!selections) {
                                return null;
                            }
                            return (
                                <EnsembleRealizationFilter
                                    key={ensembleIdent}
                                    ensembleName={ensemble.getCustomName() ?? ensemble.getDisplayName()}
                                    selections={selections}
                                    hasUnsavedSelections={ensembleIdentHasUnsavedChangesMap[ensembleIdent]}
                                    availableEnsembleRealizations={ensemble.getRealizations()}
                                    ensembleParameters={ensemble.getParameters()}
                                    isActive={isActive}
                                    isAnotherFilterActive={isAnotherActive}
                                    onClick={() => handleSetActiveEnsembleRealizationFilter(ensembleIdent)}
                                    onHeaderClick={() => handleOnEnsembleRealizationFilterHeaderClick(ensembleIdent)}
                                    onFilterChange={(newSelections) => handleFilterChange(ensembleIdent, newSelections)}
                                    onApplyClick={() => handleApplyClick(ensembleIdent)}
                                    onDiscardClick={() => handleDiscardClick(ensembleIdent)}
                                />
                            );
                        })}
                    </div>
                </div>
            </Drawer>
        </div>
    );
};
