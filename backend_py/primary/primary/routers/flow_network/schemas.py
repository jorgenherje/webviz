from enum import StrEnum

from pydantic import BaseModel, ConfigDict
from webviz_services.flow_network_assembler.flow_network_types import DatedFlowNetwork, FlowNetworkMetadata


class Frequency(StrEnum):
    DAILY = "DAILY"
    WEEKLY = "WEEKLY"
    MONTHLY = "MONTHLY"
    QUARTERLY = "QUARTERLY"
    YEARLY = "YEARLY"


class StatOption(StrEnum):
    MEAN = "MEAN"
    P10 = "P10"
    P90 = "P90"
    P50 = "P50"
    MIN = "MIN"
    MAX = "MAX"


class TreeType(StrEnum):
    # TODO: Consider more descriptive names here for front-end use, i.e. not as technical
    GRUPTREE = "GRUPTREE"
    BRANPROP = "BRANPROP"


# ! Copy of the flow network service NodeType enum
class NodeType(StrEnum):
    PROD = "prod"
    INJ = "inj"
    OTHER = "other"


class FlowNetworkData(BaseModel):
    model_config = ConfigDict(revalidate_instances="always")

    edgeMetadataList: list[FlowNetworkMetadata]
    nodeMetadataList: list[FlowNetworkMetadata]
    datedNetworks: list[DatedFlowNetwork]


class FlowNetworkPerTreeType(BaseModel):
    model_config = ConfigDict(revalidate_instances="always")

    tree_type_flow_network_map: dict[str, FlowNetworkData]
