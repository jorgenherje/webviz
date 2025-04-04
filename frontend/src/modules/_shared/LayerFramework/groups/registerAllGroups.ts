import { GroupRegistry } from "./GroupRegistry";
import { GroupType } from "./groupTypes";
import { IntersectionView } from "./implementations/IntersectionView";
import { View } from "./implementations/View";

GroupRegistry.registerGroup(GroupType.VIEW, View);
GroupRegistry.registerGroup(GroupType.INTERSECTION_VIEW, IntersectionView);
