import type { CustomGroupImplementationWithSettings } from "../../interfacesAndTypes/customGroupImplementation";
import { Setting } from "../../settings/settingsDefinitions";

export class IntersectionView
    implements CustomGroupImplementationWithSettings<[Setting.INTERSECTION, Setting.INTERSECTION_EXTENSION_LENGTH]>
{
    settings: [Setting.INTERSECTION, Setting.INTERSECTION_EXTENSION_LENGTH] = [
        Setting.INTERSECTION,
        Setting.INTERSECTION_EXTENSION_LENGTH,
    ];

    getDefaultName(): string {
        return "Intersection view";
    }

    getDefaultSettingsValues() {
        return {
            intersection: null,
            intersectionExtensionLength: 0,
        };
    }
}
