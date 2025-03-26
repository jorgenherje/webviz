import { Icon } from "@equinor/eds-core-react";
import { color_palette, grid_layer, settings, surface_layer, timeline, wellbore } from "@equinor/eds-icons";
import { WorkbenchSession } from "@framework/WorkbenchSession";
import { WorkbenchSettings } from "@framework/WorkbenchSettings";
import { Menu } from "@lib/components/Menu";
import { MenuButton } from "@lib/components/MenuButton";
import { MenuHeading } from "@lib/components/MenuHeading";
import { MenuItem } from "@lib/components/MenuItem";
import { EnsembleWellborePicksLayer } from "@modules/IntersectionNew/LayerFramework/customLayerImplementations/EnsembleWellborePicksLayer";
import { IntersectionSurfaceLayer } from "@modules/IntersectionNew/LayerFramework/customLayerImplementations/IntersectionSurfaceLayer/IntersectionSurfaceLayer";
import { PreferredViewLayout } from "@modules/IntersectionNew/typesAndEnums";
import { LayersActionGroup } from "@modules/_shared/LayerFramework/LayersActions";
import { GroupDelegate, GroupDelegateTopic } from "@modules/_shared/LayerFramework/delegates/GroupDelegate";
import { ColorScale } from "@modules/_shared/LayerFramework/framework/ColorScale/ColorScale";
import { LayerManager } from "@modules/_shared/LayerFramework/framework/LayerManager/LayerManager";
import { LayerManagerComponent } from "@modules/_shared/LayerFramework/framework/LayerManager/LayerManagerComponent";
import { SettingsGroup } from "@modules/_shared/LayerFramework/framework/SettingsGroup/SettingsGroup";
import { SharedSetting } from "@modules/_shared/LayerFramework/framework/SharedSetting/SharedSetting";
import { IntersectionRealizationGridLayer } from "@modules/_shared/LayerFramework/layers/implementations/IntersectionRealizationGridLayer/IntersectionRealizationGridLayer";
import { IntersectionRealizationObservedSeismicLayer } from "@modules/_shared/LayerFramework/layers/implementations/IntersectionRealizationObservedSeismicLayer/IntersectionRealizationObservedSeismicLayer";
import { IntersectionRealizationSimulatedSeismicLayer } from "@modules/_shared/LayerFramework/layers/implementations/IntersectionRealizationSimulatedSeismicLayer/IntersectionRealizationSimulatedSeismicLayer";
import { EnsembleSetting } from "@modules/_shared/LayerFramework/settings/implementations/EnsembleSetting";
import { RealizationSetting } from "@modules/_shared/LayerFramework/settings/implementations/RealizationSetting";
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
    layerManager: LayerManager;
    workbenchSession: WorkbenchSession;
    workbenchSettings: WorkbenchSettings;
};

export function LayerManagerComponentWrapper(props: LayerManagerComponentWrapperProps) {
    // const colorSet = props.workbenchSettings.useColorSet();
    const [preferredViewLayout, setPreferredViewLayout] = useAtom(preferredViewLayoutAtom);

    const groupDelegate = props.layerManager.getGroupDelegate();
    usePublishSubscribeTopicValue(groupDelegate, GroupDelegateTopic.CHILDREN);

    function handleLayerAction(identifier: string, groupDelegate: GroupDelegate) {
        const numSharedSettings = groupDelegate.findChildren((item) => {
            return item instanceof SharedSetting;
        }).length;

        switch (identifier) {
            case "settings-group":
                groupDelegate.insertChild(new SettingsGroup("Settings group", props.layerManager), numSharedSettings);
                return;
            case "color-scale":
                groupDelegate.prependChild(new ColorScale("Color scale", props.layerManager));
                return;
            case "realization-surface":
                groupDelegate.insertChild(new IntersectionSurfaceLayer(props.layerManager), numSharedSettings);
                return;
            case "wellbore-picks":
                groupDelegate.insertChild(new EnsembleWellborePicksLayer(props.layerManager), numSharedSettings);
                return;
            case "realization-simulated-seismic":
                groupDelegate.insertChild(
                    new IntersectionRealizationSimulatedSeismicLayer(props.layerManager),
                    numSharedSettings
                );
                return;
            case "realization-observed-seismic":
                groupDelegate.insertChild(
                    new IntersectionRealizationObservedSeismicLayer(props.layerManager),
                    numSharedSettings
                );
                return;
            case "realization-grid":
                groupDelegate.insertChild(new IntersectionRealizationGridLayer(props.layerManager), numSharedSettings);
                return;

            case "ensemble":
                groupDelegate.prependChild(new SharedSetting(new EnsembleSetting(), props.layerManager));
                return;
            case "realization":
                groupDelegate.prependChild(new SharedSetting(new RealizationSetting(), props.layerManager));
                return;
        }
    }

    // function checkIfItemMoveAllowed(movedItem: Item, destinationItem: Group): boolean {
    //     return true;
    // }

    return (
        <LayerManagerComponent
            layerManager={props.layerManager}
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
            // isMoveAllowed={checkIfItemMoveAllowed}
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
