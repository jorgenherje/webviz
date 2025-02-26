import React from "react";

import { IntersectionType } from "@framework/types/intersection";
import { Dropdown, DropdownOption } from "@lib/components/Dropdown";
import { RadioGroup } from "@lib/components/RadioGroup";

/**
 * This component is used to select an intersection from a list of available intersections.
 *
 * The component and types are based on the IntersectionSetting for the LayerFramework, and can be used
 * for e.g. global setting.
 */

export type IntersectionSelection = {
    type: IntersectionType;
    name: string;
    uuid: string;
};

export type IntersectionSelectorProps = {
    value: IntersectionSelection | null;
    availableValues: IntersectionSelection[];
    isOverridden?: boolean;
    overriddenValue?: IntersectionSelection | null;
    onValueChange: (value: IntersectionSelection | null) => void;
};

export function IntersectionSelector(props: IntersectionSelectorProps): React.ReactNode {
    const [type, setType] = React.useState<IntersectionType>(props.value?.type ?? IntersectionType.WELLBORE);
    function handleSelectionChange(selectedValue: string) {
        const newValue = props.availableValues.find((v) => v.uuid === selectedValue) ?? null;
        props.onValueChange(newValue);
    }

    function handleCategoryChange(_: any, value: IntersectionType) {
        setType(value);
        const firstValue = props.availableValues.find((v) => v.type === value);
        if (firstValue) {
            props.onValueChange({
                ...firstValue,
            });
            return;
        }

        props.onValueChange(null);
    }

    const options: DropdownOption<string>[] = props.availableValues
        .filter((value) => value.type === type)
        .map((value) => {
            return {
                label: value.name,
                value: value.uuid,
            };
        });
    return (
        <div className="flex flex-col gap-2 my-1">
            <RadioGroup
                direction="horizontal"
                options={[
                    {
                        label: "Wellbore",
                        value: IntersectionType.WELLBORE,
                    },
                    {
                        label: "Polyline",
                        value: IntersectionType.CUSTOM_POLYLINE,
                    },
                ]}
                value={type}
                onChange={handleCategoryChange}
            />
            <Dropdown<string>
                options={options}
                value={props.isOverridden ? props.overriddenValue?.uuid : props.value?.uuid}
                onChange={handleSelectionChange}
                disabled={props.isOverridden}
                showArrows
            />
        </div>
    );
}
