import type { WellboreLogCurveData_api, WellboreLogCurveHeader_api } from "@api";
import { WellLogCurveSourceEnum_api } from "@api";

import type { TemplatePlot } from "../types";

/**
 * Translates a well log curve data source to a more readable string
 * @param source A valid well log curve source (ssdl:well_log, etc.)
 * @returns A simple readable name for the source
 */
export function curveSourceToText(source: WellLogCurveSourceEnum_api) {
    switch (source) {
        case WellLogCurveSourceEnum_api.SMDA_GEOLOGY:
            return "Geology";
        case WellLogCurveSourceEnum_api.SMDA_STRATIGRAPHY:
            return "Stratigraphy";
        case WellLogCurveSourceEnum_api.SSDL_WELL_LOG:
            return "Well-log";
        case WellLogCurveSourceEnum_api.SMDA_SURVEY:
            return "Well Geometry";
    }
}

/**
 * Simplifies some well log names to make them more suited for showing in the UI.
 */
export function simplifyLogName(logName: string, truncateLength = 0) {
    // Removes curve-name, in case the log name is from a computed source (strat or geo)
    logName = logName.split("::")[0];

    // ! Unsure what sources there are, but this one seems to show up a lot for geology headers
    if (logName === "OpenWorks R5000") return "OpenWorks";
    // Fallback to ellipse for other long names
    // TODO: Generalized shortening that doesn't truncate unless absolutely neccessary?
    if (truncateLength && logName.length > truncateLength) return logName.substring(0, truncateLength - 1) + "…";
    // Fallback to name in all other cases
    return logName;
}

export function getUniqueCurveNameForPlotConfig(plot: TemplatePlot, nonUniqueNames?: Set<string>) {
    if (!plot.name) throw new Error("Unexpected invalid config");
    if (!plot.logName) throw new Error("Unexpected invalid config");

    if (nonUniqueNames?.has(plot.name)) {
        return makeCompoundCurveName(plot.name, plot.logName);
    }

    return plot.name;
}

export function getUniqueCurveNameForCurveData(curve: WellboreLogCurveData_api, nonUniqueNames?: Set<string>) {
    if (nonUniqueNames?.has(curve.name)) {
        return makeCompoundCurveName(curve.name, curve.logName);
    }

    return curve.name;
}

function makeCompoundCurveName(curveName: string, logName: string) {
    return `${curveName} - ${simplifyLogName(logName)}`;
}

export function makeSelectValueForCurveHeader(header: WellboreLogCurveHeader_api | null | undefined): string {
    if (!header) return "";

    const { source, curveName, logName } = header;
    return [source, curveName, logName].join("::");
}

export function findCurveHeaderBySelectValue(
    headers: WellboreLogCurveHeader_api[],
    uniqueKey: string,
): WellboreLogCurveHeader_api | undefined {
    return headers.find((h) => makeSelectValueForCurveHeader(h) === uniqueKey);
}
