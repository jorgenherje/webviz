import { Icon } from "@equinor/eds-core-react";
import { color_palette, grid_layer, settings, surface_layer, timeline, wellbore } from "@equinor/eds-icons";
import { WorkbenchSession } from "@framework/WorkbenchSession";
import { WorkbenchSettings } from "@framework/WorkbenchSettings";
import { Menu } from "@lib/components/Menu";
import { MenuButton } from "@lib/components/MenuButton";
import { MenuHeading } from "@lib/components/MenuHeading";
import { MenuItem } from "@lib/components/MenuItem";
import { CustomLayerType } from "@modules/IntersectionNew/LayerFramework/customLayerImplementations/layerTypes";
import { PreferredViewLayout } from "@modules/IntersectionNew/typesAndEnums";
import { LayersActionGroup } from "@modules/_shared/LayerFramework/LayersActions";
import { GroupDelegate, GroupDelegateTopic } from "@modules/_shared/LayerFramework/delegates/GroupDelegate";
import { DataLayerManager } from "@modules/_shared/LayerFramework/framework/DataLayerManager/DataLayerManager";
import { LayerManagerComponent } from "@modules/_shared/LayerFramework/framework/DataLayerManager/DataLayerManagerComponent";
import { SettingsGroup } from "@modules/_shared/LayerFramework/framework/SettingsGroup/SettingsGroup";
import { SharedSetting } from "@modules/_shared/LayerFramework/framework/SharedSetting/SharedSetting";
import { GroupRegistry } from "@modules/_shared/LayerFramework/groups/GroupRegistry";
import { LayerRegistry } from "@modules/_shared/LayerFramework/layers/LayerRegistry";
import { LayerType } from "@modules/_shared/LayerFramework/layers/layerTypes";
import { Setting } from "@modules/_shared/LayerFramework/settings/settingsDefinitions";
import { usePublishSubscribeTopicValue } from "@modules/_shared/utils/PublishSubscribeDelegate";
import { Dropdown } from "@mui/base";
import {
    Check,
    SettingsApplications,
    Settings as SettingsIcon,
    TableRowsOutlined,
    ViewColumnOutlined,
} from "@mui/icons-material";

import { useAtom } from "jotai";

import { preferredViewLayoutAtom } from "../atoms/baseAtoms";

export type LayerManagerComponentWrapperProps = {
    dataLayerManager: DataLayerManager;
    workbenchSession: WorkbenchSession;
    workbenchSettings: WorkbenchSettings;
};

export function LayerManagerComponentWrapper(props: LayerManagerComponentWrapperProps) {
    const colorSet = props.workbenchSettings.useColorSet();
    const [preferredViewLayout, setPreferredViewLayout] = useAtom(preferredViewLayoutAtom);

    const groupDelegate = props.dataLayerManager.getGroupDelegate();
    usePublishSubscribeTopicValue(groupDelegate, GroupDelegateTopic.CHILDREN);

    function handleLayerAction(identifier: string, groupDelegate: GroupDelegate) {
        if (groupDelegate.getChildren().length === 0) {
            groupDelegate.appendChild(
                GroupRegistry.makeGroup("IntersectionView", props.dataLayerManager, colorSet.getNextColor())
            );
        }
        switch (identifier) {
            case "settings-group":
                groupDelegate.appendChild(new SettingsGroup("Settings group", props.dataLayerManager));
                return;
            case "color-scale":
                groupDelegate.appendChild(new SharedSetting(Setting.COLOR_SCALE, null, props.dataLayerManager));
                return;
            case "realization-surface":
                groupDelegate.prependChild(
                    LayerRegistry.makeLayer(CustomLayerType.INTERSECTION_REALIZATION_SURFACES, props.dataLayerManager)
                );
                return;
            case "wellbore-picks":
                groupDelegate.prependChild(
                    LayerRegistry.makeLayer(CustomLayerType.ENSEMBLE_WELLBORE_PICKS, props.dataLayerManager)
                );
                return;
            case "realization-simulated-seismic":
                groupDelegate.prependChild(
                    LayerRegistry.makeLayer(
                        LayerType.INTERSECTION_REALIZATION_SIMULATED_SEISMIC,
                        props.dataLayerManager
                    )
                );
                return;
            case "realization-observed-seismic":
                groupDelegate.prependChild(
                    LayerRegistry.makeLayer(LayerType.INTERSECTION_REALIZATION_OBSERVED_SEISMIC, props.dataLayerManager)
                );
                return;
            case "realization-grid":
                groupDelegate.prependChild(
                    LayerRegistry.makeLayer(LayerType.INTERSECTION_REALIZATION_GRID, props.dataLayerManager)
                );
                return;
            case "ensemble":
                groupDelegate.appendChild(new SharedSetting(Setting.ENSEMBLE, null, props.dataLayerManager));
                return;
            case "realization":
                groupDelegate.appendChild(new SharedSetting(Setting.REALIZATION, null, props.dataLayerManager));
                return;
        }
    }

    return (
        <LayerManagerComponent
            layerManager={props.dataLayerManager}
            additionalHeaderComponents={
                <Dropdown>
                    <MenuButton label="Settings">
                        <SettingsIcon fontSize="inherit" />
                    </MenuButton>
                    <Menu>
                        <MenuHeading>Preferred view layout</MenuHeading>
                        <ViewLayoutMenuItem
                            checked={preferredViewLayout === PreferredViewLayout.HORIZONTAL}
                            onClick={() => setPreferredViewLayout(PreferredViewLayout.HORIZONTAL)}
                        >
                            <ViewColumnOutlined fontSize="inherit" /> Horizontal
                        </ViewLayoutMenuItem>
                        <ViewLayoutMenuItem
                            checked={preferredViewLayout === PreferredViewLayout.VERTICAL}
                            onClick={() => setPreferredViewLayout(PreferredViewLayout.VERTICAL)}
                        >
                            <TableRowsOutlined fontSize="inherit" /> Vertical
                        </ViewLayoutMenuItem>
                    </Menu>
                </Dropdown>
            }
            layerActions={LAYER_ACTIONS}
            onLayerAction={handleLayerAction}
        />
    );
}

type ViewLayoutMenuItemProps = {
    checked: boolean;
    onClick: () => void;
    children: React.ReactNode;
};

function ViewLayoutMenuItem(props: ViewLayoutMenuItemProps): React.ReactNode {
    return (
        <MenuItem onClick={props.onClick}>
            <div className="flex items-center gap-4">
                <div className="w-4">{props.checked && <Check fontSize="small" />}</div>
                <div className="flex gap-2 items-center">{props.children}</div>
            </div>
        </MenuItem>
    );
}

const LAYER_ACTIONS: LayersActionGroup[] = [
    {
        label: "Groups",
        children: [
            {
                identifier: "settings-group",
                icon: <SettingsApplications fontSize="small" />,
                label: "Settings group",
            },
        ],
    },
    {
        label: "Layers",
        children: [
            {
                label: "Surfaces",
                children: [
                    {
                        identifier: "realization-surface",
                        icon: <Icon data={surface_layer} fontSize="small" />,
                        label: "Realization Surface",
                    },
                ],
            },
            {
                label: "Wells",
                children: [
                    {
                        identifier: "wellbore-picks",
                        icon: <Icon data={wellbore} fontSize="small" />,
                        label: "Wellbore Picks",
                    },
                ],
            },
            {
                label: "Seismic",
                children: [
                    {
                        identifier: "realization-simulated-seismic",
                        icon: <Icon data={timeline} fontSize="small" />,
                        label: "Realization Simulated Seismic",
                    },
                    {
                        identifier: "realization-observed-seismic",
                        icon: <Icon data={timeline} fontSize="small" />,
                        label: "Realization Observed Seismic",
                    },
                ],
            },
            {
                label: "Others",
                children: [
                    {
                        identifier: "realization-grid",
                        icon: <Icon data={grid_layer} fontSize="small" />,
                        label: "Realization Grid",
                    },
                ],
            },
        ],
    },
    {
        label: "Shared Settings",
        children: [
            {
                identifier: "ensemble",
                icon: <Icon data={settings} fontSize="small" />,
                label: "Ensemble",
            },
            {
                identifier: "realization",
                icon: <Icon data={settings} fontSize="small" />,
                label: "Realization",
            },
            // {
            //     identifier: "surface-name",
            //     icon: <Icon data={settings} fontSize="small" />,
            //     label: "Surface Name",
            // },
            // {
            //     identifier: "attribute",
            //     icon: <Icon data={settings} fontSize="small" />,
            //     label: "Attribute",
            // },
            // {
            //     identifier: "date",
            //     icon: <Icon data={settings} fontSize="small" />,
            //     label: "Date",
            // },
        ],
    },
    {
        label: "Utilities",
        children: [
            {
                identifier: "color-scale",
                icon: <Icon data={color_palette} fontSize="small" />,
                label: "Color scale",
            },
        ],
    },
];
