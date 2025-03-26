import React from "react";

import { Input } from "@lib/components/Input";

import { SettingDelegate } from "../../delegates/SettingDelegate";
import { Setting, SettingComponentProps } from "../../interfaces";
import { SettingRegistry } from "../SettingRegistry";
import { SettingType } from "../settingsTypes";

type ValueType = number | null;

export class IntersectionExtensionLengthSetting implements Setting<ValueType> {
    private _delegate: SettingDelegate<ValueType>;

    constructor() {
        this._delegate = new SettingDelegate<ValueType>(null, this);
    }

    getType(): SettingType {
        return SettingType.INTERSECTION_EXTENSION_LENGTH;
    }

    getLabel(): string {
        return "Intersection extension length";
    }

    getDelegate(): SettingDelegate<ValueType> {
        return this._delegate;
    }
    makeComponent(): (props: SettingComponentProps<ValueType>) => React.ReactNode {
        return function IntersectionExtensionLengthInput(props: SettingComponentProps<ValueType>) {
            function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
                props.onValueChange(Number(event.target.value));
            }

            return (
                <Input
                    type="number"
                    value={props.value ?? 0}
                    min={0}
                    debounceTimeMs={600}
                    onChange={handleInputChange}
                />
            );
        };
    }
}

SettingRegistry.registerSetting(IntersectionExtensionLengthSetting);
