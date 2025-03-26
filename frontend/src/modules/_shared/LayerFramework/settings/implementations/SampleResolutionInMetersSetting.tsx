import React from "react";

import { Input } from "@lib/components/Input";

import { SettingDelegate } from "../../delegates/SettingDelegate";
import { AvailableValuesType, Setting, SettingComponentProps } from "../../interfaces";
import { SettingRegistry } from "../SettingRegistry";
import { SettingType } from "../settingsTypes";

type ValueType = number | null;

// TODO:
// - Consider a reusable component for this setting - NumberInputSetting ?
//      - How to provided min and max?
export class SampleResolutionInMetersSetting implements Setting<ValueType> {
    private _delegate: SettingDelegate<ValueType>;
    private _minValue = 1;

    constructor() {
        const isStatic = true;
        this._delegate = new SettingDelegate<ValueType>(null, this, isStatic);
    }

    getType(): SettingType {
        return SettingType.SAMPLE_RESOLUTION_IN_METERS;
    }

    getLabel(): string {
        return "Sample resolution";
    }

    getDelegate(): SettingDelegate<ValueType> {
        return this._delegate;
    }

    isValueValid(availableValues: AvailableValuesType<ValueType>, value: ValueType): boolean {
        if (value === null) {
            return false;
        }
        if (availableValues.length === 0) {
            return false;
        }
        const maxValue = availableValues[0];
        return value >= this._minValue && value <= maxValue;
    }

    fixupValue(availableValues: AvailableValuesType<ValueType>, currentValue: ValueType): ValueType {
        if (availableValues.length === 0 || currentValue === null) {
            return this._minValue;
        }

        const maxValue = availableValues[0];
        if (currentValue < this._minValue) {
            return this._minValue;
        }
        if (currentValue > maxValue) {
            return maxValue;
        }
        return currentValue;
    }

    makeComponent(): (props: SettingComponentProps<number | null>) => React.ReactNode {
        const minValue = this._minValue;
        return function Realization(props: SettingComponentProps<number | null>) {
            function handleSelectionChange(event: React.ChangeEvent<HTMLInputElement>) {
                const newValue = Number(event.target.value);
                props.onValueChange(newValue);
            }
            return (
                <Input
                    type="number"
                    value={!props.isOverridden ? props.value ?? 1 : props.overriddenValue ?? 1}
                    min={minValue}
                    max={props.availableValues[0] ?? 1}
                    onChange={handleSelectionChange}
                    disabled={props.isOverridden}
                    endAdornment="m"
                />
            );
        };
    }
}

SettingRegistry.registerSetting(SampleResolutionInMetersSetting);
