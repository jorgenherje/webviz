import React from "react";

import type { SubsurfaceViewerProps } from "@webviz/subsurface-viewer";
import SubsurfaceViewer from "@webviz/subsurface-viewer";
import type { ViewStateType } from "@webviz/subsurface-viewer/dist/components/Map";

import type { ViewContext } from "@framework/ModuleContext";
import { SyncSettingKey, SyncSettingsHelper } from "@framework/SyncSettings";
import type { WorkbenchServices } from "@framework/WorkbenchServices";

export type SyncedSubsurfaceViewerProps = {
    viewContext: ViewContext<any>;
    workbenchServices: WorkbenchServices;
} & SubsurfaceViewerProps;

export function SyncedSubsurfaceViewer(props: SyncedSubsurfaceViewerProps): JSX.Element {
    const { viewContext, workbenchServices, ...rest } = props;
    const syncedSettingKeys = viewContext.useSyncedSettingKeys();
    const syncHelper = new SyncSettingsHelper(syncedSettingKeys, workbenchServices);

    const [cameraPosition, setCameraPosition] = React.useState<ViewStateType | undefined>(undefined);

    function onCameraChange(viewport: ViewStateType) {
        syncHelper.publishValue(SyncSettingKey.CAMERA_POSITION_MAP, "global.syncValue.cameraPositionMap", {
            target: viewport.target,
            zoom: viewport.zoom as number,
            rotationX: viewport.rotationX,
            rotationOrbit: viewport.rotationOrbit,
        });
        setCameraPosition(viewport);
    }
    const computedCameraPosition =
        syncHelper.useValue(SyncSettingKey.CAMERA_POSITION_MAP, "global.syncValue.cameraPositionMap") || cameraPosition;

    return (
        <SubsurfaceViewer
            getCameraPosition={onCameraChange}
            cameraPosition={computedCameraPosition}
            {...rest}
        ></SubsurfaceViewer>
    );
}
