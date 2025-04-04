import { Icon } from "@equinor/eds-core-react";
import { color_palette, grid_layer, settings, surface_layer, timeline, wellbore } from "@equinor/eds-icons";
import type { WorkbenchSession } from "@framework/WorkbenchSession";
import type { WorkbenchSettings } from "@framework/WorkbenchSettings";
import { Menu } from "@lib/components/Menu";
import { MenuButton } from "@lib/components/MenuButton";
import { MenuHeading } from "@lib/components/MenuHeading";
import { MenuItem } from "@lib/components/MenuItem";
import { CustomLayerType } from "@modules/IntersectionNew/LayerFramework/customLayerImplementations/layerTypes";
import { PreferredViewLayout } from "@modules/IntersectionNew/typesAndEnums";
import { ActionGroup } from "@modules/_shared/LayerFramework/Actions";
import type { GroupDelegate } from "@modules/_shared/LayerFramework/delegates/GroupDelegate";
import { GroupDelegateTopic } from "@modules/_shared/LayerFramework/delegates/GroupDelegate";
import type { DataLayerManager } from "@modules/_shared/LayerFramework/framework/DataLayerManager/DataLayerManager";
import { DataLayerManagerComponent } from "@modules/_shared/LayerFramework/framework/DataLayerManager/DataLayerManagerComponent";
import { Group } from "@modules/_shared/LayerFramework/framework/Group/Group";
import { SettingsGroup } from "@modules/_shared/LayerFramework/framework/SettingsGroup/SettingsGroup";
import { SharedSetting } from "@modules/_shared/LayerFramework/framework/SharedSetting/SharedSetting";
import { GroupRegistry } from "@modules/_shared/LayerFramework/groups/GroupRegistry";
import { GroupType } from "@modules/_shared/LayerFramework/groups/groupTypes";
import { ItemGroup } from "@modules/_shared/LayerFramework/interfacesAndTypes/entities";
import { LayerRegistry } from "@modules/_shared/LayerFramework/layers/LayerRegistry";
import { LayerType } from "@modules/_shared/LayerFramework/layers/layerTypes";
import { Setting } from "@modules/_shared/LayerFramework/settings/settingsDefinitions";
import { usePublishSubscribeTopicValue } from "@modules/_shared/utils/PublishSubscribeDelegate";
import { Dropdown } from "@mui/base";
import {
    Check,
    Panorama,
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

    function handleAction(identifier: string, groupDelegate: GroupDelegate) {
        switch (identifier) {
            case "intersection-view": {
                const hasIntersectionView =
                    groupDelegate.getDescendantItems(
                        (item) => item instanceof Group && item.getGroupType() === GroupType.INTERSECTION_VIEW,
                    ).length > 0;
                if (!hasIntersectionView) {
                    groupDelegate.appendChild(
                        GroupRegistry.makeGroup(
                            GroupType.INTERSECTION_VIEW,
                            props.dataLayerManager,
                            colorSet.getNextColor(),
                        ),
                    );
                }
                return;
            }
            case "settings-group":
                groupDelegate.appendChild(new SettingsGroup("Settings group", props.dataLayerManager));
                return;
            case "color-scale":
                groupDelegate.appendChild(new SharedSetting(Setting.COLOR_SCALE, null, props.dataLayerManager));
                return;
            case "realization-surfaces":
                groupDelegate.prependChild(
                    LayerRegistry.makeLayer(CustomLayerType.INTERSECTION_REALIZATION_SURFACES, props.dataLayerManager),
                );
                return;
            case "wellbore-picks":
                groupDelegate.prependChild(
                    LayerRegistry.makeLayer(CustomLayerType.ENSEMBLE_WELLBORE_PICKS, props.dataLayerManager),
                );
                return;
            case "realization-simulated-seismic":
                groupDelegate.prependChild(
                    LayerRegistry.makeLayer(
                        LayerType.INTERSECTION_REALIZATION_SIMULATED_SEISMIC,
                        props.dataLayerManager,
                    ),
                );
                return;
            case "realization-observed-seismic":
                groupDelegate.prependChild(
                    LayerRegistry.makeLayer(
                        LayerType.INTERSECTION_REALIZATION_OBSERVED_SEISMIC,
                        props.dataLayerManager,
                    ),
                );
                return;
            case "realization-grid":
                groupDelegate.prependChild(
                    LayerRegistry.makeLayer(LayerType.INTERSECTION_REALIZATION_GRID, props.dataLayerManager),
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

    function makeActionsForGroup(group: ItemGroup): ActionGroup[] {
        const hasIntersectionView =
            groupDelegate.getDescendantItems(
                (item) => item instanceof Group && item.getGroupType() === GroupType.INTERSECTION_VIEW,
            ).length > 0;

        if (!hasIntersectionView) {
            return INITIAL_ACTIONS;
        }

        if (group instanceof Group) {
            if (group.getGroupType() === GroupType.INTERSECTION_VIEW) {
                return ACTIONS;
            }
        }

        return [];
    }

    return (
        <DataLayerManagerComponent
            title={"Intersection Views"}
            dataLayerManager={props.dataLayerManager}
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
            // layerActions={adjustedLayerActions}
            groupActions={makeActionsForGroup}
            onAction={handleAction}
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

const INITIAL_ACTIONS: ActionGroup[] = [
    {
        label: "Groups",
        children: [
            {
                identifier: "intersection-view",
                icon: <Panorama fontSize="small" />,
                label: "Intersection View",
            },
        ],
    },
];

const ACTIONS: ActionGroup[] = [
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
                        identifier: "realization-surfaces",
                        icon: <Icon data={surface_layer} fontSize="small" />,
                        label: "Realization Surfaces",
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
