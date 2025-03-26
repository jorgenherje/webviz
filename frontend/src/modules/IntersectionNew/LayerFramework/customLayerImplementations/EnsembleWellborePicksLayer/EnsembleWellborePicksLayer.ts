import { WellborePick_api } from "@api";
import { ItemDelegate } from "@modules/_shared/LayerFramework/delegates/ItemDelegate";
import { LayerColoringType, LayerDelegate } from "@modules/_shared/LayerFramework/delegates/LayerDelegate";
import { LayerManager } from "@modules/_shared/LayerFramework/framework/LayerManager/LayerManager";
import { BoundingBox, Layer, SerializedLayer } from "@modules/_shared/LayerFramework/interfaces";
import { LayerRegistry } from "@modules/_shared/LayerFramework/layers/LayerRegistry";
import { SettingType } from "@modules/_shared/LayerFramework/settings/settingsTypes";

import _ from "lodash";

import { EnsembleWellborePicksSettingsContext } from "./EnsembleWellborePicksSettingsContext";
import { EnsembleWellborePicksSettings } from "./types";

export class EnsembleWellborePicksLayer implements Layer<EnsembleWellborePicksSettings, WellborePick_api[]> {
    private _layerDelegate: LayerDelegate<EnsembleWellborePicksSettings, WellborePick_api[]>;
    private _itemDelegate: ItemDelegate;

    constructor(layerManager: LayerManager) {
        this._itemDelegate = new ItemDelegate("Ensemble Wellbore Picks", layerManager);
        this._layerDelegate = new LayerDelegate(
            this,
            layerManager,
            new EnsembleWellborePicksSettingsContext(layerManager),
            LayerColoringType.NONE
        );
    }

    getSettingsContext() {
        return this._layerDelegate.getSettingsContext();
    }

    getItemDelegate(): ItemDelegate {
        return this._itemDelegate;
    }

    getLayerDelegate(): LayerDelegate<EnsembleWellborePicksSettings, WellborePick_api[]> {
        return this._layerDelegate;
    }

    doSettingsChangesRequireDataRefetch(
        prevSettings: EnsembleWellborePicksSettings,
        newSettings: EnsembleWellborePicksSettings
    ): boolean {
        // NOTE: Global settings change does not trigger this function for some reason
        return !_.isEqual(prevSettings, newSettings);
    }

    makeBoundingBox(): BoundingBox | null {
        const data = this._layerDelegate.getData();
        if (!data) {
            return null;
        }

        // TODO: Implement bounding box calculation
        if (data) {
            return null;
        }

        return null;
    }

    fetchData(): Promise<WellborePick_api[]> {
        const settings = this.getSettingsContext().getDelegate().getSettings();
        const selectedWellborePicks = settings[SettingType.WELLBORE_PICKS].getDelegate().getValue() ?? [];

        // ! Not actually any reason for this to be a promise.
        // No data to fetch, it's already available in the well-picks
        return new Promise((resolve) => {
            resolve(selectedWellborePicks);
        });
    }

    serializeState(): SerializedLayer<EnsembleWellborePicksSettings> {
        return this._layerDelegate.serializeState();
    }

    deserializeState(serializedState: SerializedLayer<EnsembleWellborePicksSettings>): void {
        this._layerDelegate.deserializeState(serializedState);
    }
}

LayerRegistry.registerLayer(EnsembleWellborePicksLayer);
