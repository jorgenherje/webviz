// import { IntersectionType } from "@framework/types/intersection";
import type { IntersectionViewSettings } from "@modules/_shared/LayerFramework/groups/implementations/IntersectionView";
import { Setting } from "@modules/_shared/LayerFramework/settings/settingsDefinitions";
import type {
    ViewDataCollectorFunction,
    VisualizationTarget,
} from "@modules/_shared/LayerFramework/visualization/VisualizationFactory";

export const makeEsvViewDataCollection: ViewDataCollectorFunction<
    IntersectionViewSettings,
    VisualizationTarget.ESV
> = ({ getSetting }) => {
    const intersection = getSetting(Setting.INTERSECTION);
    const intersectionExtensionLength = getSetting(Setting.INTERSECTION_EXTENSION_LENGTH);

    // if (!intersection) {
    //     throw new Error("Intersection is not defined");
    // }
    // if (intersection.type === IntersectionType.WELLBORE && intersectionExtensionLength === null) {
    //     throw new Error("Intersection extension length is not defined for wellbore intersection");
    // }

    return {
        intersection: intersection,
        extensionLength: intersectionExtensionLength,
    };
};
