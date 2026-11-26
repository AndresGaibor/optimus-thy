"""Pruebas de la política de retención configurable."""

from __future__ import annotations

import pytest
from pydantic import ValidationError

from app.config import Settings


def test_plazos_de_retencion_tienen_valores_seguros_por_defecto() -> None:
    settings = Settings(_env_file=None)

    assert settings.retencion_trabajos_dias == 90
    assert settings.retencion_alertas_dias == 365
    assert settings.purga_habilitada is False


@pytest.mark.parametrize("campo", ["retencion_trabajos_dias", "retencion_alertas_dias"])
def test_plazo_de_retencion_exige_al_menos_un_dia(campo: str) -> None:
    with pytest.raises(ValidationError):
        Settings(_env_file=None, **{campo: 0})
