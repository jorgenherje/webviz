from typing import List, Optional

import polars as pl

from webviz_services.sumo_access.group_tree_types import TreeType
from webviz_services.service_exceptions import InvalidDataError, MultipleDataMatchesError, NoDataError, Service


class GroupTreeDataframeModel:
    """
    A helper class for handling group tree dataframes retrieved from Sumo.

    Provides a set of methods for filtering and extracting data from the dataframe.

    The group tree dataframe in model has to have the following columns:

    * DATE
    * CHILD
    * PARENT
    * KEYWORD (GRUPTREE, BRANPROP or WELSPECS)
    * REAL

    If gruptrees are exactly equal in all realizations then only one tree is
    stored in the dataframe. That means the REAL column will only have one unique value.
    If not, all trees are stored.
    """

    _grouptree_df: pl.DataFrame
    _terminal_node: Optional[str]
    _tree_type: TreeType

    _grouptree_wells: List[str] = []
    _grouptree_tree_types: List[str] = []

    def __init__(
        self,
        grouptree_df: pl.DataFrame,
        tree_type: TreeType,
        terminal_node: Optional[str] = None,
    ):
        """
        Initialize the group tree model with group tree dataframe and tree type

        Expected columns have to be present in the dataframe:
        * DATE
        * CHILD
        * PARENT
        * KEYWORD (GRUPTREE, BRANPROP or WELSPECS)
        """

        # Validate expected columns - verify existence and data types
        GroupTreeDataframeModel.validate_expected_columns(grouptree_df)

        if tree_type.value not in grouptree_df["KEYWORD"].unique().to_list():
            raise NoDataError(f"Tree type: {tree_type} not found in grouptree dataframe.", service=Service.GENERAL)

        # Note: Only support single realization for now
        if "REAL" in grouptree_df.columns:
            raise MultipleDataMatchesError(
                "Only single realization is supported for group tree now.", service=Service.GENERAL
            )

        self._terminal_node = terminal_node
        self._tree_type = tree_type

        # Filter to include only dates where the selected tree type is defined
        # and only include WELSPECS that belong to the selected tree type
        self._grouptree_df = self._filter_by_tree_type(grouptree_df, tree_type)

        # Extract wells and groups with expressions
        wells_expr = pl.col("KEYWORD") == "WELSPECS"
        tree_type_expr = pl.col("KEYWORD").is_in(["GRUPTREE", "BRANPROP"])
        self._grouptree_wells = self._grouptree_df.filter(wells_expr)["CHILD"].unique().to_list()
        self._grouptree_tree_types = self._grouptree_df.filter(tree_type_expr)["CHILD"].unique().to_list()

    @staticmethod
    def _filter_by_tree_type(df: pl.DataFrame, tree_type: TreeType) -> pl.DataFrame:
        """
        Filter dataframe to include only dates where the selected tree type is defined,
        and only include WELSPECS nodes that belong to the selected tree type.

        A WELSPECS node belongs to a tree if its parent node exists in that tree's definition.
        """
        # Find dates where the selected tree type is defined
        dates_for_tree_type = df.filter(pl.col("KEYWORD") == tree_type.value).select("DATE").unique()["DATE"]

        # Filter to only include rows from those dates
        df = df.filter(pl.col("DATE").is_in(dates_for_tree_type))

        # Get all nodes that are defined in the selected tree type (across all dates)
        tree_nodes = df.filter(pl.col("KEYWORD") == tree_type.value).select("CHILD").unique()["CHILD"]

        # Keep rows that are:
        # 1. The selected tree type itself (GRUPTREE or BRANPROP)
        # 2. WELSPECS whose parent exists in the selected tree type
        return df.filter(
            (pl.col("KEYWORD") == tree_type.value)
            | ((pl.col("KEYWORD") == "WELSPECS") & pl.col("PARENT").is_in(tree_nodes))
        )

    @staticmethod
    def validate_expected_columns(dataframe: pl.DataFrame) -> None:
        """
        Validate expected columns and their data types for the dataframe to ensure correct processing.
        """
        if not GroupTreeDataframeModel.has_expected_columns(dataframe):
            raise InvalidDataError(
                f"Expected columns: {GroupTreeDataframeModel._expected_columns()} not found in the grouptree dataframe. "
                f"Columns found: {dataframe.columns}",
                service=Service.GENERAL,
            )

        expected_dtypes = {
            "DATE": pl.Datetime,
            "CHILD": pl.String,
            "PARENT": pl.String,
            "KEYWORD": pl.String,
        }

        for column, expected_dtype in expected_dtypes.items():
            actual_dtype = dataframe[column].dtype
            if actual_dtype != expected_dtype:
                raise InvalidDataError(
                    f"Column '{column}' has incorrect data type. Expected: {expected_dtype}, Got: {actual_dtype}",
                    service=Service.GENERAL,
                )

    @staticmethod
    def has_expected_columns(dataframe: pl.DataFrame) -> bool:
        """
        Verify if the dataframe has the expected columns
        """
        return GroupTreeDataframeModel._expected_columns().issubset(dataframe.columns)

    @staticmethod
    def _expected_columns() -> set[str]:
        """
        List of expected columns in the group tree dataframe
        """
        return {"DATE", "CHILD", "KEYWORD", "PARENT"}

    @property
    def dataframe(self) -> pl.DataFrame:
        """Returns a dataframe that will have the following columns:
        * DATE
        * CHILD (node in tree)
        * PARENT (node in tree)
        * KEYWORD (GRUPTREE, WELSPECS or BRANPROP)
        * REAL

        If gruptrees are exactly equal in all realizations then only one tree is
        stored in the dataframe. That means the REAL column will only have one unique value.
        If not, all trees are stored.
        """
        return self._grouptree_df

    @property
    def group_tree_wells(self) -> List[str]:
        """
        List of all wells in the group tree dataframe
        """
        return self._grouptree_wells

    @property
    def group_tree_tree_types(self) -> List[str]:
        """
        List of all group tree types in the group tree dataframe
        """
        return self._grouptree_tree_types

    def create_filtered_dataframe(
        self,
        terminal_node: Optional[str] = None,
        excl_well_startswith: Optional[List[str]] = None,
        excl_well_endswith: Optional[List[str]] = None,
    ) -> pl.DataFrame:
        """This function returns a sub-set of the rows in the gruptree dataframe
        filtered according to the input arguments:

        - terminal_node: returns the terminal node and all nodes below it in the
        tree (for all realizations and dates)
        - excl_well_startswith: removes WELSPECS rows where CHILD starts with any
        of the entries in the list.
        - excl_well_endswith: removes WELSPECS rows where CHILD ends with any
        of the entries in the list.

        """
        df = self._grouptree_df

        # Build mask for rows - default all rows
        num_rows = df.height
        mask = pl.Series([True] * num_rows)

        # Filter by terminal node (branch extraction)
        if terminal_node is not None:
            if terminal_node not in df["CHILD"].unique().to_list():
                raise NoDataError(
                    f"Terminal node '{terminal_node}' not found in 'CHILD' column of the gruptree data.",
                    Service.GENERAL,
                )
            if terminal_node != "FIELD":
                branch_nodes = self._create_branch_node_list(terminal_node)
                branch_mask = df["CHILD"].is_in(branch_nodes)
                mask = mask & branch_mask

        # Filter out wells by prefix
        if excl_well_startswith is not None:
            welspecs_mask = df["KEYWORD"] == "WELSPECS"
            # Build exclude mask for any prefix match
            exclude_mask = pl.Series([False] * num_rows)
            for prefix in excl_well_startswith:
                exclude_mask = exclude_mask | df["CHILD"].str.starts_with(prefix)
            # Only exclude WELSPECS rows that match the prefixes
            mask = mask & ~(welspecs_mask & exclude_mask)

        # Filter out wells by suffix
        if excl_well_endswith is not None:
            welspecs_mask = df["KEYWORD"] == "WELSPECS"
            # Build exclude mask for any suffix match
            exclude_mask = pl.Series([False] * num_rows)
            for suffix in excl_well_endswith:
                exclude_mask = exclude_mask | df["CHILD"].str.ends_with(suffix)
            # Only exclude WELSPECS rows that match the suffixes
            mask = mask & ~(welspecs_mask & exclude_mask)

        return df.filter(mask)

    def _create_branch_node_list(self, terminal_node: str) -> List[str]:
        """
        This function lists all nodes in a branch of the group tree starting from the terminal node.
        """
        branch_node_set = {terminal_node}

        nodes_array = self._grouptree_df["CHILD"].to_numpy()
        parents_array = self._grouptree_df["PARENT"].to_numpy()

        if terminal_node not in parents_array:
            return list(branch_node_set)

        current_parents = [terminal_node]
        while len(current_parents) > 0:
            # Find all indexes matching the current parents
            children_indices = {i for i, x in enumerate(parents_array) if x in current_parents}

            if not children_indices:
                break

            # Find all children of the current parents
            children = nodes_array[list(children_indices)]
            branch_node_set.update(children)
            current_parents = children

        return list(branch_node_set)
