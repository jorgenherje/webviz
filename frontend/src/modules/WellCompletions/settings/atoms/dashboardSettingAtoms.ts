import { makeDashboardPersistableFixableAtoms } from "@framework/DashboardSettings/adapters/jotai";
import { REALIZATION_DASHBOARD_SETTING } from "@framework/DashboardSettings/definitions/realization";
import { TIME_DASHBOARD_SETTING } from "@framework/DashboardSettings/definitions/time";
import { isoStringToTimestampUtcMs } from "@framework/utils/timestampUtils";

import { availableRealizationsAtom, sortedCompletionDatesAtom } from "./derivedAtoms";
import {
    selectedCompletionDateIndexAtom,
    selectedEnsembleIdentAtom,
    selectedRealizationAtom,
} from "./persistableFixableAtoms";

/**
 * `effectiveRealizationAtom` is the realization in effect: the dashboard setting's realization while that
 * is active (see `isRealizationDashboardControlledAtom`), otherwise the module's own selection. It contributes the
 * realizations of the selected ensemble to the dashboard setting.
 *
 * Read `effectiveRealizationAtom` - but persist `selectedRealizationAtom`, the module's own selection.
 */
export const { valueAtom: effectiveRealizationAtom, isDashboardControlledAtom: isRealizationDashboardControlledAtom } =
    makeDashboardPersistableFixableAtoms(() => selectedRealizationAtom, {
        definition: REALIZATION_DASHBOARD_SETTING,
        // No ensemble selected yet means no opinion, rather than "no realizations available"
        getConstraints: (get) => (get(selectedEnsembleIdentAtom).value ? get(availableRealizationsAtom) : null),
    });


/**
 * `effectiveCompletionDateIndexAtom` is the time step index in effect: the index of the dashboard setting's time
 * while that is active (see `isCompletionDateIndexDashboardControlledAtom`), otherwise the module's own selection. It
 * contributes the completion dates to the dashboard setting.
 *
 * Read `effectiveCompletionDateIndexAtom` - but persist `selectedCompletionDateIndexAtom`, the module's own selection.
 * The dashboard time is only applicable to a single time step, i.e. when no time aggregation is used.
 */
export const {
    valueAtom: effectiveCompletionDateIndexAtom,
    isDashboardControlledAtom: isCompletionDateIndexDashboardControlledAtom,
} = makeDashboardPersistableFixableAtoms(() => selectedCompletionDateIndexAtom, {
    definition: TIME_DASHBOARD_SETTING,
    // Without completion dates there is no opinion, rather than "no time steps available"
    getConstraints: (get) => {
        const sortedCompletionDates = get(sortedCompletionDatesAtom);
        return sortedCompletionDates && sortedCompletionDates.length > 0
            ? sortedCompletionDates.map(isoStringToTimestampUtcMs)
            : null;
    },
    mapDashboardValue: (dashboardTime, get) => {
        const index = (get(sortedCompletionDatesAtom) ?? []).findIndex(
            (date) => isoStringToTimestampUtcMs(date) === dashboardTime,
        );
        return index >= 0 ? index : null;
    },
});
