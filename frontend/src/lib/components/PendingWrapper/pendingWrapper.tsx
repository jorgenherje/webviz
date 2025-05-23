import type React from "react";

import { CircularProgress } from "@lib/components/CircularProgress";
import { resolveClassNames } from "@lib/utils/resolveClassNames";

// Base state wrapper props
export type PendingWrapperProps = {
    isPending: boolean;
    className?: string;
    errorMessage?: string;
    children: React.ReactNode;
};

export const PendingWrapper: React.FC<PendingWrapperProps> = (props) => {
    return (
        <div
            className={resolveClassNames("relative rounded-sm", props.className, {
                "outline outline-blue-100 outline-offset-2": props.isPending,
                "outline outline-red-100 outline-offset-2": Boolean(!props.isPending && props.errorMessage),
            })}
        >
            {props.isPending && (
                <div className="absolute left-0 right-0 w-full h-full bg-white/80 flex items-center justify-center z-10 backdrop-blur-xs">
                    <CircularProgress size="medium-small" />
                </div>
            )}
            {!props.isPending && props.errorMessage && (
                <div className="absolute left-0 right-0 w-full h-full bg-white/80 flex items-center justify-center z-10 p-4 text-center backdrop-blur-xs">
                    {props.errorMessage}
                </div>
            )}
            {props.children}
        </div>
    );
};
