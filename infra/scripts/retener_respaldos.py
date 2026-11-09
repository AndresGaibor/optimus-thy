#!/usr/bin/env python3
"""Retención configurable de respaldos OPTIMUS-THY.

Conserva:
- todos los sets de los últimos N días;
- el set más nuevo de cada una de las últimas N semanas ISO;
- el más nuevo de cada uno de los últimos N meses;
- y siempre el set recién creado (--keep-stamp).

Borra db-<sello>.sql.gz.gpg, archivos-<sello>.tar.gz.gpg y
SHA256SUMS-<sello> de los sets no conservados. Idempotente.

Solo stdlib.
"""
from __future__ import annotations

import argparse
import re
import sys
from datetime import date, datetime, timedelta
from pathlib import Path

STAMP_RE = re.compile(r"^(?:db|archivos|SHA256SUMS)-(\d{8}-\d{6})")


def parse_stamp(stamp: str) -> datetime:
    return datetime.strptime(stamp, "%Y%m%d-%H%M%S")


def discover_sets(directory: Path) -> dict[str, list[Path]]:
    sets: dict[str, list[Path]] = {}
    for path in directory.iterdir():
        if not path.is_file():
            continue
        m = STAMP_RE.match(path.name)
        if not m:
            continue
        stamp = m.group(1)
        try:
            parse_stamp(stamp)
        except ValueError:
            continue
        sets.setdefault(stamp, []).append(path)
    return sets


def select_keep(stamps: list[str], days: int, weeks: int, months: int, today: date) -> set[str]:
    keep: set[str] = set()
    if not stamps:
        return keep

    by_stamp = {s: parse_stamp(s) for s in stamps}

    day_cutoff = today - timedelta(days=max(days - 1, 0))
    for s, dt in by_stamp.items():
        if dt.date() >= day_cutoff:
            keep.add(s)

    # Últimas N semanas ISO: el set más nuevo de cada semana.
    week_keys: dict[tuple[int, int], str] = {}
    for s, dt in sorted(by_stamp.items(), key=lambda kv: kv[1], reverse=True):
        iso = dt.isocalendar()
        key = (iso.year, iso.week)
        if key not in week_keys:
            week_keys[key] = s
    recent_weeks = sorted(week_keys.keys(), reverse=True)[: max(weeks, 0)]
    for key in recent_weeks:
        keep.add(week_keys[key])

    # Últimos N meses: el más nuevo de cada mes.
    month_keys: dict[tuple[int, int], str] = {}
    for s, dt in sorted(by_stamp.items(), key=lambda kv: kv[1], reverse=True):
        key = (dt.year, dt.month)
        if key not in month_keys:
            month_keys[key] = s
    recent_months = sorted(month_keys.keys(), reverse=True)[: max(months, 0)]
    for key in recent_months:
        keep.add(month_keys[key])

    return keep


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dir", required=True, help="Directorio de respaldos")
    parser.add_argument("--days", type=int, default=14, help="Días a conservar completos")
    parser.add_argument("--weeks", type=int, default=8, help="Semanas ISO con set más nuevo")
    parser.add_argument("--months", type=int, default=6, help="Meses con set más nuevo")
    parser.add_argument("--dry-run", action="store_true", help="Solo mostrar acciones")
    parser.add_argument(
        "--keep-stamp",
        action="append",
        default=[],
        help="Sello AAAAMMDD-HHMMSS a conservar siempre (repetible)",
    )
    args = parser.parse_args(argv)

    for name, value in (("days", args.days), ("weeks", args.weeks), ("months", args.months)):
        if value < 0:
            print(f"ERROR: --{name} no puede ser negativo: {value}", file=sys.stderr)
            return 2

    directory = Path(args.dir)
    if not directory.is_dir():
        print(f"ERROR: directorio no existe: {directory}", file=sys.stderr)
        return 2

    sets = discover_sets(directory)
    stamps = sorted(sets.keys())
    today = date.today()
    keep = select_keep(stamps, args.days, args.weeks, args.months, today)
    for stamp in args.keep_stamp:
        if stamp in sets:
            keep.add(stamp)
        else:
            # Conservar explícito aunque no se haya descubierto (p. ej. recién creado
            # con patrón válido); no hay archivos que borrar en ese caso.
            keep.add(stamp)

    to_delete = [s for s in stamps if s not in keep]
    to_keep = [s for s in stamps if s in keep]

    print(f"directorio: {directory}")
    print(f"política: dias={args.days} semanas={args.weeks} meses={args.months}")
    print(f"sets encontrados: {len(stamps)} conservados: {len(to_keep)} a borrar: {len(to_delete)}")
    if to_keep:
        print("conservar: " + ", ".join(to_keep))
    if not to_delete:
        print("sin cambios: no hay sets fuera de política")
        return 0

    for stamp in to_delete:
        files = sets.get(stamp, [])
        for path in files:
            if args.dry_run:
                print(f"DRY-RUN borrar: {path}")
            else:
                path.unlink(missing_ok=True)
                print(f"borrado: {path}")
    if args.dry_run:
        print(f"DRY-RUN: {len(to_delete)} set(s) se borrarían")
    else:
        print(f"OK: {len(to_delete)} set(s) borrados")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
