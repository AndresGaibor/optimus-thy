"""Esquemas Pydantic compartidos."""

from typing import Literal

from pydantic import BaseModel


class Health(BaseModel):
    """Estado del servicio."""

    status: Literal["ok"]
