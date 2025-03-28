import { GroupRegistry } from "./GroupRegistry";
import { IntersectionView } from "./implementations/IntersectionView";
import { View } from "./implementations/View";

GroupRegistry.registerGroup("View", View);
GroupRegistry.registerGroup("IntersectionView", IntersectionView);
