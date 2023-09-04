import React from "react";

import { Frequency_api, StatisticFunction_api, VectorDescription_api } from "@api";
import { EnsembleIdent } from "@framework/EnsembleIdent";
import { EnsembleSet } from "@framework/EnsembleSet";
import { ModuleFCProps } from "@framework/Module";
import { useEnsembleSet } from "@framework/WorkbenchSession";
import { MultiEnsembleSelect } from "@framework/components/MultiEnsembleSelect";
import { Checkbox } from "@lib/components/Checkbox";
import { CollapsibleGroup } from "@lib/components/CollapsibleGroup";
import { Dropdown } from "@lib/components/Dropdown";
import { Label } from "@lib/components/Label";
import { RadioGroup } from "@lib/components/RadioGroup";
import { SmartNodeSelectorSelection } from "@lib/components/SmartNodeSelector";
import { VectorSelector } from "@lib/components/VectorSelector";
import { resolveClassNames } from "@lib/utils/resolveClassNames";
import { createVectorSelectorDataFromVectors } from "@lib/utils/vectorSelectorUtils";

import { isEqual } from "lodash";

import { useVectorListQueries } from "./queryHooks";
import {
    FanchartStatisticOption,
    FanchartStatisticOptionEnumToStringMapping,
    GroupBy,
    GroupByEnumToStringMapping,
    State,
    StatisticFunctionEnumToStringMapping,
    VectorSpec,
    VisualizationMode,
    VisualizationModeEnumToStringMapping,
} from "./state";
import { makeFrequencyDropdownOptions } from "./utils/elementOptionsUtils";
import { EnsembleVectorListsHelper } from "./utils/ensemblesVectorListHelper";

export function settings({ moduleContext, workbenchSession }: ModuleFCProps<State>) {
    const ensembleSet = useEnsembleSet(workbenchSession);
    const [resampleFrequency, setResamplingFrequency] = moduleContext.useStoreState("resamplingFrequency");
    const [groupBy, setGroupBy] = moduleContext.useStoreState("groupBy");
    const [visualizationMode, setVisualizationMode] = moduleContext.useStoreState("visualizationMode");
    const [showHistorical, setShowHistorical] = moduleContext.useStoreState("showHistorical");
    const [showObservations, setShowObservations] = moduleContext.useStoreState("showObservations");
    const [statisticsSelection, setStatisticsSelection] = moduleContext.useStoreState("statisticsSelection");
    const setVectorSpecifications = moduleContext.useSetStoreValue("vectorSpecifications");

    const [previousEnsembleSet, setPreviousEnsembleSet] = React.useState<EnsembleSet>(ensembleSet);
    const [selectedEnsembleIdents, setSelectedEnsembleIdents] = React.useState<EnsembleIdent[]>([]);
    const [selectedVectorNames, setSelectedVectorNames] = React.useState<string[]>([]);

    const [prevVisualizationMode, setPrevVisualizationMode] = React.useState<VisualizationMode>(visualizationMode);
    if (prevVisualizationMode !== visualizationMode) {
        setPrevVisualizationMode(visualizationMode);
    }

    const vectorListQueries = useVectorListQueries(selectedEnsembleIdents);
    const ensembleVectorListsHelper = new EnsembleVectorListsHelper(selectedEnsembleIdents, vectorListQueries);
    const vectorsUnion: VectorDescription_api[] = ensembleVectorListsHelper.vectorsUnion();

    const vectorSelectorData = createVectorSelectorDataFromVectors(vectorsUnion.map((vector) => vector.name));

    const newSelectedVectorNames = [];
    for (const vector of selectedVectorNames) {
        if (
            vectorsUnion.some((item) => {
                return item.name === vector;
            })
        ) {
            newSelectedVectorNames.push(vector);
        }
    }
    if (!isEqual(selectedVectorNames, newSelectedVectorNames)) {
        setSelectedVectorNames(newSelectedVectorNames);
    }

    const selectedVectorNamesHasHistorical = ensembleVectorListsHelper.hasAnyHistoricalVector(newSelectedVectorNames);

    if (!isEqual(ensembleSet, previousEnsembleSet)) {
        // TODO:
        // Handle change of ensembleSet-> validity of ensemble selection and vector selection
        setPreviousEnsembleSet(ensembleSet);
    }

    React.useEffect(
        function propagateVectorSpecsToView() {
            const newVectorSpecifications: VectorSpec[] = [];
            for (const ensemble of selectedEnsembleIdents) {
                for (const vector of selectedVectorNames) {
                    if (!ensembleVectorListsHelper.isVectorInEnsemble(ensemble, vector)) {
                        return;
                    }

                    newVectorSpecifications.push({
                        ensembleIdent: ensemble,
                        vectorName: vector,
                        hasHistoricalVector: ensembleVectorListsHelper.hasHistoricalVector(ensemble, vector),
                    });
                }
            }

            setVectorSpecifications(newVectorSpecifications);
        },
        [selectedEnsembleIdents, selectedVectorNames, ensembleVectorListsHelper.numberOfQueriesWithData()]
    );

    function handleGroupByChange(event: React.ChangeEvent<HTMLInputElement>) {
        setGroupBy(event.target.value as GroupBy);
    }

    function handleEnsembleSelectChange(ensembleIdentArr: EnsembleIdent[]) {
        setSelectedEnsembleIdents(ensembleIdentArr);
    }

    function handleVectorSelectChange(selection: SmartNodeSelectorSelection) {
        setSelectedVectorNames(selection.selectedTags);
    }

    function handleFrequencySelectionChange(frequency: string) {
        setResamplingFrequency(frequency as Frequency_api);
    }

    function handleShowHistorical(event: React.ChangeEvent<HTMLInputElement>) {
        setShowHistorical(event.target.checked);
    }

    function handleShowObservations(event: React.ChangeEvent<HTMLInputElement>) {
        setShowObservations(event.target.checked);
    }

    function handleVisualizationModeChange(event: React.ChangeEvent<HTMLInputElement>) {
        setVisualizationMode(event.target.value as VisualizationMode);
    }

    function handleFanchartStatisticsSelectionChange(
        event: React.ChangeEvent<HTMLInputElement>,
        statistic: FanchartStatisticOption
    ) {
        setStatisticsSelection((prev) => {
            if (event.target.checked) {
                return {
                    IndividualStatisticsSelection: prev.IndividualStatisticsSelection,
                    FanchartStatisticsSelection: prev.FanchartStatisticsSelection
                        ? [...prev.FanchartStatisticsSelection, statistic]
                        : [statistic],
                };
            } else {
                return {
                    IndividualStatisticsSelection: prev.IndividualStatisticsSelection,
                    FanchartStatisticsSelection: prev.FanchartStatisticsSelection
                        ? prev.FanchartStatisticsSelection.filter((item) => item !== statistic)
                        : [],
                };
            }
        });
    }

    function handleIndividualStatisticsSelectionChange(
        event: React.ChangeEvent<HTMLInputElement>,
        statistic: StatisticFunction_api
    ) {
        setStatisticsSelection((prev) => {
            if (event.target.checked) {
                return {
                    IndividualStatisticsSelection: prev.IndividualStatisticsSelection
                        ? [...prev.IndividualStatisticsSelection, statistic]
                        : [statistic],
                    FanchartStatisticsSelection: prev.FanchartStatisticsSelection,
                };
            } else {
                return {
                    IndividualStatisticsSelection: prev.IndividualStatisticsSelection
                        ? prev.IndividualStatisticsSelection.filter((item) => item !== statistic)
                        : [],
                    FanchartStatisticsSelection: prev.FanchartStatisticsSelection,
                };
            }
        });
    }

    return (
        <div className="flex flex-col gap-2 overflow-y-auto">
            <CollapsibleGroup expanded={true} title="Group by">
                <RadioGroup
                    value={groupBy}
                    options={Object.values(GroupBy).map((val: GroupBy) => {
                        return { value: val, label: GroupByEnumToStringMapping[val] };
                    })}
                    onChange={handleGroupByChange}
                />
            </CollapsibleGroup>
            <CollapsibleGroup expanded={true} title="Resampling frequency">
                <Dropdown
                    options={makeFrequencyDropdownOptions()}
                    value={resampleFrequency ?? makeFrequencyDropdownOptions()[0].value}
                    onChange={handleFrequencySelectionChange}
                />
            </CollapsibleGroup>
            <CollapsibleGroup expanded={true} title="Ensembles">
                <MultiEnsembleSelect
                    ensembleSet={ensembleSet}
                    value={selectedEnsembleIdents}
                    size={5}
                    onChange={handleEnsembleSelectChange}
                />
            </CollapsibleGroup>
            <CollapsibleGroup expanded={true} title="Vectors">
                <Checkbox
                    label="Show historical"
                    checked={showHistorical}
                    disabled={!selectedVectorNamesHasHistorical}
                    onChange={handleShowHistorical}
                />
                <Checkbox
                    label="Show observations - NEED DATA IN SUMO"
                    checked={showObservations}
                    disabled={true}
                    onChange={handleShowObservations}
                />
                <VectorSelector
                    data={vectorSelectorData}
                    selectedTags={selectedVectorNames}
                    placeholder="Add new vector..."
                    maxNumSelectedNodes={50}
                    numSecondsUntilSuggestionsAreShown={0.5}
                    lineBreakAfterTag={true}
                    onChange={handleVectorSelectChange}
                />
            </CollapsibleGroup>
            <CollapsibleGroup expanded={true} title="Visualization">
                <RadioGroup
                    value={visualizationMode}
                    options={Object.values(VisualizationMode).map((val: VisualizationMode) => {
                        return { value: val, label: VisualizationModeEnumToStringMapping[val] };
                    })}
                    onChange={handleVisualizationModeChange}
                />
                <div className="mt-4">
                    <Label text="Statistics Options">
                        <div
                            className={resolveClassNames({
                                "pointer-events-none opacity-40":
                                    visualizationMode === VisualizationMode.INDIVIDUAL_REALIZATIONS,
                            })}
                        >
                            {visualizationMode === VisualizationMode.STATISTICAL_FANCHART ||
                            (visualizationMode === VisualizationMode.INDIVIDUAL_REALIZATIONS &&
                                prevVisualizationMode === VisualizationMode.STATISTICAL_FANCHART)
                                ? Object.values(FanchartStatisticOption).map((value: FanchartStatisticOption) => {
                                      return (
                                          <Checkbox
                                              key={value}
                                              label={FanchartStatisticOptionEnumToStringMapping[value]}
                                              checked={statisticsSelection?.FanchartStatisticsSelection?.includes(
                                                  value
                                              )}
                                              onChange={(event) => {
                                                  handleFanchartStatisticsSelectionChange(event, value);
                                              }}
                                          />
                                      );
                                  })
                                : Object.values(StatisticFunction_api).map((value: StatisticFunction_api) => {
                                      return (
                                          <Checkbox
                                              key={value}
                                              label={StatisticFunctionEnumToStringMapping[value]}
                                              checked={statisticsSelection?.IndividualStatisticsSelection.includes(
                                                  value
                                              )}
                                              onChange={(event) => {
                                                  handleIndividualStatisticsSelectionChange(event, value);
                                              }}
                                          />
                                      );
                                  })}
                        </div>
                    </Label>
                </div>
            </CollapsibleGroup>
        </div>
    );
}