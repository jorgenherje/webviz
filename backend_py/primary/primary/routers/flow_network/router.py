import asyncio
import logging
from fastapi import APIRouter, Depends, HTTPException, Query

from webviz_core_utils.perf_timer import PerfTimer
from webviz_services.flow_network_assembler.flow_network_assembler import FlowNetworkAssembler
from webviz_services.flow_network_assembler.flow_network_types import NetworkModeOptions, NodeType
from webviz_services.sumo_access.group_tree_access import GroupTreeAccess
from webviz_services.sumo_access.summary_access import Frequency, SummaryAccess
from webviz_services.utils.authenticated_user import AuthenticatedUser

from primary.auth.auth_helper import AuthHelper

from . import schemas
from . import converters

LOGGER = logging.getLogger(__name__)

router = APIRouter()


@router.get("/realization_flow_network/")
async def get_realization_flow_network(
    # fmt:off
    authenticated_user: AuthenticatedUser = Depends(AuthHelper.get_authenticated_user),
    case_uuid: str = Query(description="Sumo case uuid"),
    ensemble_name: str = Query(description="Ensemble name"),
    realization: int = Query(description="Realization"),
    resampling_frequency: schemas.Frequency = Query(description="Resampling frequency"),
    node_type_set: set[schemas.NodeType] = Query(description="Node types"),
    # fmt:on
) -> schemas.FlowNetworkPerTreeType:
    timer = PerfTimer()

    group_tree_access = GroupTreeAccess.from_ensemble_name(
        authenticated_user.get_sumo_access_token(), case_uuid, ensemble_name
    )
    summary_access = SummaryAccess.from_ensemble_name(
        authenticated_user.get_sumo_access_token(), case_uuid, ensemble_name
    )
    summary_frequency = Frequency.from_string_value(resampling_frequency.value)
    if summary_frequency is None:
        summary_frequency = Frequency.YEARLY

    # Convert to NodeType enum in group_tree_types
    unique_node_types = {NodeType(elm.value) for elm in node_type_set}

    tree_types = [schemas.TreeType.EXTENDED_NETWORK, schemas.TreeType.PRODUCTION_NETWORK]
    # tree_types = [schemas.TreeType.EXTENDED_NETWORK]
    # tree_types = [schemas.TreeType.PRODUCTION_NETWORK]
    network_assemblers: list[FlowNetworkAssembler] = []
    for tree_type in tree_types:
        network_assembler = FlowNetworkAssembler(
            group_tree_access=group_tree_access,
            summary_access=summary_access,
            realization=realization,
            summary_frequency=summary_frequency,
            selected_node_types=unique_node_types,
            tree_type=converters.from_api_tree_type(tree_type),
            flow_network_mode=NetworkModeOptions.SINGLE_REAL,
        )
        network_assemblers.append(network_assembler)

    timer.lap_ms()

    # Create async tasks to fetch both tree types in parallel
    async with asyncio.TaskGroup() as tg:
        for assembler in network_assemblers:
            tg.create_task(assembler.fetch_and_initialize_async())

    initialize_time_ms = timer.lap_ms()

    resulting_map: dict[str, schemas.FlowNetworkData] = {}

    # Handle the initialized assemblers
    for i, assembler in enumerate(network_assemblers):
        tree_type = tree_types[i]
        (
            dated_networks,
            edge_metadata,
            node_metadata,
        ) = assembler.create_dated_networks_and_metadata_lists()

        resulting_map[tree_type.value] = schemas.FlowNetworkData(
            edgeMetadataList=edge_metadata, nodeMetadataList=node_metadata, datedNetworks=dated_networks
        )

    create_data_time_ms = timer.lap_ms()

    LOGGER.info(
        f"Group tree data for single realization fetched and processed in: {timer.elapsed_ms()}ms "
        f"(initialize={initialize_time_ms}ms, create group tree={create_data_time_ms}ms)"
    )

    return schemas.FlowNetworkPerTreeType(tree_type_flow_network_map=resulting_map)
