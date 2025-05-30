import React from "react";

import type { ButtonProps as ButtonUnstyledProps } from "@mui/base";
import { Button as ButtonUnstyled } from "@mui/base";

import { resolveClassNames } from "@lib/utils/resolveClassNames";

import { BaseComponent } from "../BaseComponent";

export type ButtonProps = {
    variant?: "text" | "outlined" | "contained";
    startIcon?: React.ReactNode;
    endIcon?: React.ReactNode;
    color?: "primary" | "danger" | "success" | "secondary";
    size?: "small" | "medium" | "large";
    buttonRef?: React.Ref<HTMLButtonElement>;
} & ButtonUnstyledProps;

function ButtonComponent(props: ButtonProps, ref: React.ForwardedRef<HTMLDivElement>) {
    const { disabled, variant, children, startIcon, endIcon, color, buttonRef, ...rest } = props;

    const internalRef = React.useRef<HTMLButtonElement>(null);
    React.useImperativeHandle<HTMLButtonElement | null, HTMLButtonElement | null>(buttonRef, () => internalRef.current);

    const classNames = [
        "inline-flex",
        "items-center",
        ...(props.size === "medium"
            ? ["px-2", "py-1"]
            : props.size === "small"
              ? ["px-1", "py-0.5"]
              : ["px-4", "py-2"]),
        "font-medium",
        "rounded-md",
    ];

    if (variant === "outlined") {
        classNames.push("border", "bg-transparent");
        if (color === "primary" || !color) {
            classNames.push("border-indigo-600", "text-indigo-600", "hover:bg-indigo-50");
        } else if (color === "danger") {
            classNames.push("border-red-600", "text-red-600", "hover:bg-red-50");
        } else if (color === "success") {
            classNames.push("border-green-600", "text-green-600", "hover:bg-green-50");
        } else if (color === "secondary") {
            classNames.push("border-slate-500", "text-slate-600", "hover:bg-slate-50");
        }
    } else if (variant === "contained") {
        classNames.push("border", "border-transparent", "text-white");
        if (color === "primary" || !color) {
            classNames.push("bg-indigo-600", "hover:bg-indigo-700");
        } else if (color === "danger") {
            classNames.push("bg-red-600", "hover:bg-red-700");
        } else if (color === "success") {
            classNames.push("bg-green-600", "hover:bg-green-700");
        } else if (color === "secondary") {
            classNames.push("bg-slate-500", "hover:bg-slate-600");
        }
    } else {
        classNames.push("bg-transparent");
        if (color === "primary" || !color) {
            classNames.push("text-indigo-600", "hover:bg-indigo-100");
        } else if (color === "danger") {
            classNames.push("text-red-600", "hover:bg-red-100");
        } else if (color === "success") {
            classNames.push("text-green-600", "hover:bg-green-100");
        } else if (color === "secondary") {
            classNames.push("text-slate-600", "hover:bg-slate-100");
        }
    }

    classNames.push(props.className ?? "");

    const adjustedChildren = (
        <div className="flex items-center gap-2">
            {startIcon}
            {children}
            {endIcon}
        </div>
    );

    return (
        <BaseComponent disabled={disabled} ref={ref}>
            <ButtonUnstyled
                {...rest}
                ref={buttonRef}
                slotProps={{
                    root: {
                        className: resolveClassNames(...classNames),
                    },
                }}
            >
                {adjustedChildren}
            </ButtonUnstyled>
        </BaseComponent>
    );
}

export const Button = React.forwardRef(ButtonComponent);
