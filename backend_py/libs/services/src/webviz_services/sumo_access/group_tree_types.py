from enum import StrEnum


class TreeType(StrEnum):
    """
    In a group tree table, it can be two types of tree definitions for a given date.

    GRUPTREE: Group tree definition for both producing and injecting wells.
    BRANPROP: Group tree definition for producing wells only.
    """

    GRUPTREE = "GRUPTREE"
    BRANPROP = "BRANPROP"


class StatOptions(StrEnum):
    MEAN = "mean"
    P10 = "p10"
    P50 = "p50"
    P90 = "p90"
    MAX = "max"
    MIN = "min"


class KeywordColumnValues(StrEnum):
    GRUPTREE = "GRUPTREE"
    BRANPROP = "BRANPROP"
    WELSPECS = "WELSPECS"
