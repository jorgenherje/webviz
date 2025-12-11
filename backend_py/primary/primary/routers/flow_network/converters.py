from webviz_services.sumo_access.group_tree_types import TreeType

from . import schemas


def from_api_tree_type(tree_type: schemas.TreeType) -> TreeType:
    """
    Convert API tree type to internal TreeType enum
    """
    if tree_type == schemas.TreeType.GRUPTREE:
        return TreeType.GRUPTREE
    elif tree_type == schemas.TreeType.BRANPROP:
        return TreeType.BRANPROP
    else:
        raise ValueError(f"Unsupported tree type: {tree_type}")
