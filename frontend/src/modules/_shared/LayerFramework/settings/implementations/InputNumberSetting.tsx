import { Input } from "@lib/components/Input";

import {
    CustomSettingImplementation,
    SettingComponentProps,
} from "../../interfacesAndTypes/customSettingImplementation";
import { MakeAvailableValuesTypeBasedOnCategory } from "../../interfacesAndTypes/utils";
import { SettingCategory } from "../settingsDefinitions";

type ValueType = number | null;

export class InputNumberSetting implements CustomSettingImplementation<ValueType, SettingCategory.NUMBER> {
    isValueValid(
        value: ValueType,
        availableValues: MakeAvailableValuesTypeBasedOnCategory<ValueType, SettingCategory.NUMBER>
    ): boolean {
        if (value === null) {
            return false;
        }

        if (!availableValues) {
            return false;
        }

        const min = availableValues[0];
        const max = availableValues[1];
        if (max === null || min === null) {
            return false;
        }

        return value >= min && value <= max;
    }

    fixupValue(
        currentValue: ValueType,
        availableValues: MakeAvailableValuesTypeBasedOnCategory<ValueType, SettingCategory.NUMBER>
    ): ValueType {
        if (availableValues.length < 2) {
            return null;
        }

        const min = availableValues[0];
        const max = availableValues[1];

        if (max === null) {
            return null;
        }

        if (currentValue === null) {
            return min;
        }

        return Math.min(Math.max(currentValue, min), max);
    }

    makeComponent(): (props: SettingComponentProps<ValueType, SettingCategory.NUMBER>) => React.ReactNode {
        return function InputNumberSetting(props: SettingComponentProps<ValueType, SettingCategory.NUMBER>) {
            const min = props.availableValues?.[0] ?? 0;
            const max = props.availableValues?.[1] ?? 0;

            function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
                props.onValueChange(Number(event.target.value));
            }

            return (
                <Input
                    type="number"
                    value={!props.isOverridden ? props.value ?? 0 : props.overriddenValue}
                    min={min}
                    max={max}
                    debounceTimeMs={600}
                    onChange={handleInputChange}
                />
            );
        };
    }
}
