import React from "react";

import { useQuery } from "@tanstack/react-query";
import { cloneDeep, isEqual } from "lodash";

import { getSeismicCubeMetaListOptions } from "@api";
import { ColorScaleSelector } from "@framework/components/ColorScaleSelector";
import type { ColorScaleSpecification } from "@framework/components/ColorScaleSelector/colorScaleSelector";
import { EnsembleDropdown } from "@framework/components/EnsembleDropdown";
import type { EnsembleSet } from "@framework/EnsembleSet";
import type { RegularEnsembleIdent } from "@framework/RegularEnsembleIdent";
import { isIsoStringInterval } from "@framework/utils/timestampUtils";
import type { WorkbenchSession } from "@framework/WorkbenchSession";
import { useEnsembleRealizationFilterFunc } from "@framework/WorkbenchSession";
import type { WorkbenchSettings } from "@framework/WorkbenchSettings";
import type { DropdownOption } from "@lib/components/Dropdown";
import { Dropdown } from "@lib/components/Dropdown";
import { Input } from "@lib/components/Input";
import { PendingWrapper } from "@lib/components/PendingWrapper";
import { RadioGroup } from "@lib/components/RadioGroup";
import type { SelectOption } from "@lib/components/Select";
import { isoIntervalStringToDateLabel, isoStringToDateLabel } from "@modules/_shared/utils/isoDatetimeStringFormatting";
import { useLayerSettings } from "@modules/Intersection/utils/layers/BaseLayer";
import type { SeismicLayer, SeismicLayerSettings } from "@modules/Intersection/utils/layers/SeismicLayer";
import { SeismicDataType, SeismicSurveyType } from "@modules/Intersection/utils/layers/SeismicLayer";


import { fixupSetting } from "./utils";

const SeismicDataTypeToStringMapping = {
    [SeismicDataType.SIMULATED]: "Simulated",
    [SeismicDataType.OBSERVED]: "Observed",
};

const SeismicSurveyTypeToStringMapping = {
    [SeismicSurveyType.THREE_D]: "3D",
    [SeismicSurveyType.FOUR_D]: "4D",
};

export type SeismicLayerSettingsProps = {
    layer: SeismicLayer;
    ensembleSet: EnsembleSet;
    workbenchSession: WorkbenchSession;
    workbenchSettings: WorkbenchSettings;
};

export function SeismicLayerSettingsComponent(props: SeismicLayerSettingsProps): React.ReactNode {
    const settings = useLayerSettings(props.layer);
    const [newSettings, setNewSettings] = React.useState<SeismicLayerSettings>(cloneDeep(settings));
    const [prevSettings, setPrevSettings] = React.useState<SeismicLayerSettings>(cloneDeep(settings));

    if (!isEqual(settings, prevSettings)) {
        setPrevSettings(settings);
        setNewSettings(settings);
    }

    const ensembleFilterFunc = useEnsembleRealizationFilterFunc(props.workbenchSession);

    const seismicCubeMetaListQuery = useSeismicCubeMetaListQuery(newSettings.ensembleIdent);

    const fixupEnsembleIdent = fixupSetting(
        "ensembleIdent",
        props.ensembleSet.getRegularEnsembleArray().map((el) => el.getIdent()),
        newSettings
    );
    if (!isEqual(fixupEnsembleIdent, newSettings.ensembleIdent)) {
        setNewSettings((prev) => ({ ...prev, ensembleIdent: fixupEnsembleIdent }));
    }

    if (fixupEnsembleIdent) {
        const fixupRealizationNum = fixupSetting("realizationNum", ensembleFilterFunc(fixupEnsembleIdent), newSettings);
        if (!isEqual(fixupRealizationNum, newSettings.realizationNum)) {
            setNewSettings((prev) => ({ ...prev, realizationNum: fixupRealizationNum }));
        }
    }

    const availableRealizations: number[] = [];
    if (fixupEnsembleIdent) {
        availableRealizations.push(...ensembleFilterFunc(fixupEnsembleIdent));
    }

    const availableSeismicAttributes: string[] = [];

    const availableSeismicDateOrIntervalStrings: string[] = [];
    if (seismicCubeMetaListQuery.data) {
        availableSeismicAttributes.push(
            ...Array.from(
                new Set(
                    seismicCubeMetaListQuery.data
                        .filter((el) => {
                            return (
                                el.isDepth &&
                                el.isObservation === (newSettings.dataType === SeismicDataType.OBSERVED) &&
                                ((newSettings.surveyType === SeismicSurveyType.THREE_D &&
                                    !isIsoStringInterval(el.isoDateOrInterval)) ||
                                    (newSettings.surveyType === SeismicSurveyType.FOUR_D &&
                                        isIsoStringInterval(el.isoDateOrInterval)))
                            );
                        })
                        .map((el) => el.seismicAttribute)
                )
            )
        );

        availableSeismicDateOrIntervalStrings.push(
            ...Array.from(
                new Set(
                    seismicCubeMetaListQuery.data
                        .filter((el) => {
                            return (
                                el.isDepth &&
                                el.seismicAttribute === newSettings.attribute &&
                                el.isObservation === (newSettings.dataType === SeismicDataType.OBSERVED) &&
                                ((newSettings.surveyType === SeismicSurveyType.THREE_D &&
                                    !isIsoStringInterval(el.isoDateOrInterval)) ||
                                    (newSettings.surveyType === SeismicSurveyType.FOUR_D &&
                                        isIsoStringInterval(el.isoDateOrInterval)))
                            );
                        })
                        .map((el) => el.isoDateOrInterval)
                )
            ).sort()
        );
    }

    if (seismicCubeMetaListQuery.data) {
        const fixupAttribute = fixupSetting("attribute", availableSeismicAttributes, newSettings);
        if (!isEqual(fixupAttribute, newSettings.attribute)) {
            setNewSettings((prev) => ({ ...prev, attribute: fixupAttribute }));
        }

        const fixupDateOrInterval = fixupSetting("dateOrInterval", availableSeismicDateOrIntervalStrings, newSettings);
        if (!isEqual(fixupDateOrInterval, newSettings.dateOrInterval)) {
            setNewSettings((prev) => ({ ...prev, dateOrInterval: fixupDateOrInterval }));
        }
    }

    let seismicCubeMetaListErrorMessage = "";
    if (seismicCubeMetaListQuery.isError) {
        seismicCubeMetaListErrorMessage = "Failed to load seismic cube meta list";
    }

    React.useEffect(
        function propagateSettingsChange() {
            props.layer.maybeUpdateSettings(cloneDeep(newSettings));
        },
        [newSettings, props.layer]
    );

    React.useEffect(
        function maybeRefetchData() {
            props.layer.setIsSuspended(seismicCubeMetaListQuery.isFetching);
            if (!seismicCubeMetaListQuery.isFetching) {
                props.layer.maybeRefetchData();
            }
        },
        [seismicCubeMetaListQuery.isFetching, props.layer, newSettings]
    );

    function handleEnsembleChange(ensembleIdent: RegularEnsembleIdent | null) {
        setNewSettings((prev) => ({ ...prev, ensembleIdent }));
    }

    function handleRealizationChange(realizationNum: string) {
        setNewSettings((prev) => ({ ...prev, realizationNum: parseInt(realizationNum) }));
    }

    function handleDataTypeChange(event: React.ChangeEvent<HTMLInputElement>) {
        setNewSettings((prev) => ({ ...prev, dataType: event.target.value as SeismicDataType }));
    }

    function handleSurveyTypeChange(event: React.ChangeEvent<HTMLInputElement>) {
        setNewSettings((prev) => ({ ...prev, surveyType: event.target.value as SeismicSurveyType }));
    }

    function handleAttributeChange(selected: string) {
        setNewSettings((prev) => ({ ...prev, attribute: selected }));
    }

    function handleDateOrIntervalChange(selected: string) {
        setNewSettings((prev) => ({ ...prev, dateOrInterval: selected }));
    }

    function handleResolutionChange(e: React.ChangeEvent<HTMLInputElement>) {
        setNewSettings((prev) => ({ ...prev, resolution: parseFloat(e.target.value) }));
    }

    function handleColorScaleChange(newColorScale: ColorScaleSpecification) {
        props.layer.setUseCustomColorScaleBoundaries(newColorScale.areBoundariesUserDefined);
        props.layer.setColorScale(newColorScale.colorScale);
    }

    return (
        <div className="table text-sm border-spacing-y-2 border-spacing-x-3 w-full">
            <div className="table-row">
                <div className="table-cell align-middle w-24">Ensemble</div>
                <div className="table-cell">
                    <EnsembleDropdown
                        value={props.layer.getSettings().ensembleIdent}
                        ensembles={props.ensembleSet.getRegularEnsembleArray()}
                        onChange={handleEnsembleChange}
                        debounceTimeMs={600}
                    />
                </div>
            </div>
            <div className="table-row">
                <div className="table-cell align-middle">Realization</div>
                <div className="table-cell">
                    <Dropdown
                        options={makeRealizationOptions(availableRealizations)}
                        value={newSettings.realizationNum?.toString() ?? undefined}
                        onChange={handleRealizationChange}
                        showArrows
                        debounceTimeMs={600}
                    />
                </div>
            </div>
            <div className="table-row">
                <div className="table-cell align-middle">Data type</div>
                <div className="table-cell">
                    <RadioGroup
                        options={[
                            {
                                label: SeismicDataTypeToStringMapping[SeismicDataType.SIMULATED],
                                value: SeismicDataType.SIMULATED,
                            },
                            {
                                label: SeismicDataTypeToStringMapping[SeismicDataType.OBSERVED],
                                value: SeismicDataType.OBSERVED,
                            },
                        ]}
                        value={props.layer.getSettings().dataType}
                        onChange={handleDataTypeChange}
                        direction="horizontal"
                    />
                </div>
            </div>
            <div className="table-row">
                <div className="table-cell align-middle">Survey type</div>
                <div className="table-cell">
                    <RadioGroup
                        options={[
                            {
                                label: SeismicSurveyTypeToStringMapping[SeismicSurveyType.THREE_D],
                                value: SeismicSurveyType.THREE_D,
                            },
                            {
                                label: SeismicSurveyTypeToStringMapping[SeismicSurveyType.FOUR_D],
                                value: SeismicSurveyType.FOUR_D,
                            },
                        ]}
                        value={props.layer.getSettings().surveyType}
                        onChange={handleSurveyTypeChange}
                        direction="horizontal"
                    />
                </div>
            </div>
            <div className="table-row">
                <div className="table-cell align-middle">Attribute</div>
                <div className="table-cell">
                    <PendingWrapper
                        isPending={seismicCubeMetaListQuery.isFetching}
                        errorMessage={seismicCubeMetaListErrorMessage}
                    >
                        <Dropdown
                            options={makeAttributeOptions(availableSeismicAttributes)}
                            value={props.layer.getSettings().attribute ?? undefined}
                            onChange={handleAttributeChange}
                            showArrows
                            debounceTimeMs={600}
                        />
                    </PendingWrapper>
                </div>
            </div>
            <div className="table-row">
                <div className="table-cell align-middle">Date or interval</div>
                <div className="table-cell">
                    <PendingWrapper
                        isPending={seismicCubeMetaListQuery.isFetching}
                        errorMessage={seismicCubeMetaListErrorMessage}
                    >
                        <Dropdown
                            options={makeDateOrIntervalStringOptions(availableSeismicDateOrIntervalStrings)}
                            value={props.layer.getSettings().dateOrInterval ?? undefined}
                            onChange={handleDateOrIntervalChange}
                            showArrows
                            debounceTimeMs={600}
                        />
                    </PendingWrapper>
                </div>
            </div>
            <div className="table-row">
                <div className="table-cell align-middle">Sample resolution</div>
                <div className="table-cell">
                    <Input
                        value={newSettings.resolution}
                        onChange={handleResolutionChange}
                        debounceTimeMs={600}
                        endAdornment="m"
                        type="number"
                        min={1}
                    />
                </div>
            </div>
            <div className="table-row">
                <div className="table-cell align-top">Color scale</div>
                <div className="table-cell">
                    <ColorScaleSelector
                        colorScaleSpecification={{
                            colorScale: props.layer.getColorScale(),
                            areBoundariesUserDefined: props.layer.getUseCustomColorScaleBoundaries(),
                        }}
                        workbenchSettings={props.workbenchSettings}
                        onChange={handleColorScaleChange}
                    />
                </div>
            </div>
        </div>
    );
}

function makeRealizationOptions(realizations: readonly number[]): DropdownOption[] {
    return realizations.map((realization) => ({ label: realization.toString(), value: realization.toString() }));
}

function makeAttributeOptions(availableSeismicAttributes: string[]): SelectOption[] {
    return availableSeismicAttributes.map((attribute) => ({
        label: attribute,
        value: attribute,
    }));
}

function makeDateOrIntervalStringOptions(availableSeismicDateOrIntervalStrings: string[]): SelectOption[] {
    return availableSeismicDateOrIntervalStrings.map((dateOrInterval) => ({
        label: dateOrInterval.includes("/")
            ? isoIntervalStringToDateLabel(dateOrInterval)
            : isoStringToDateLabel(dateOrInterval),
        value: dateOrInterval,
    }));
}

function useSeismicCubeMetaListQuery(ensembleIdent: RegularEnsembleIdent | null) {
    return useQuery({
        ...getSeismicCubeMetaListOptions({
            query: {
                case_uuid: ensembleIdent?.getCaseUuid() ?? "",
                ensemble_name: ensembleIdent?.getEnsembleName() ?? "",
            },
        }),
        enabled: Boolean(ensembleIdent),
    });
}
