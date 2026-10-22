"""Reconstruye perfiles y mecanizados del Librero Pared Emi.

El DXF contiene un juego final: dos laterales, tres fondos y el panel
frente/base. Los XML trabajan paneles múltiples y se separan aquí en piezas
finales antes de alimentar etiquetas y visor.
"""
from __future__ import annotations

import json
import re
import xml.etree.ElementTree as ET
from pathlib import Path

import ezdxf
from ezdxf.path import make_path

ROUTER = Path(r"G:\Mi unidad\Produccion\Maquinas\Pantografo\Hermes 28\Prod a Medida\Victoria Bongiovanni\Librero Pared")
FLEX = Path(r"G:\Mi unidad\Produccion\Maquinas\Flex\Archivos Corte\A Medida\Bongiovanni\MA0009040006 Librero Pared")
OUT = Path(__file__).resolve().parents[1] / "src" / "librero-pared-data.json"


def points(entity):
    raw = [(float(p.x), float(p.y)) for p in make_path(entity).flattening(.35, segments=14)]
    result = []
    for x, y in raw:
        if not result or abs(result[-1][0]-x) > .02 or abs(result[-1][1]-y) > .02:
            result.append((x, y))
    if len(result) > 2 and abs(result[0][0]-result[-1][0]) < .02 and abs(result[0][1]-result[-1][1]) < .02:
        result.pop()
    return result


def bounds(entity):
    pts = points(entity)
    return min(x for x, _ in pts), min(y for _, y in pts), max(x for x, _ in pts), max(y for _, y in pts)


def near(entity, width, height, tolerance=.8):
    x0, y0, x1, y1 = bounds(entity)
    return abs(x1-x0-width) < tolerance and abs(y1-y0-height) < tolerance


def normalized(entity, mirror_x=False):
    pts = [(-x if mirror_x else x, y) for x, y in points(entity)]
    x0 = min(x for x, _ in pts)
    y0 = min(y for _, y in pts)
    return [[round(x-x0, 3), round(y-y0, 3)] for x, y in pts]


def numeric(expression, length, width, thickness):
    expression = (expression or "0").replace("L", str(length)).replace("W", str(width)).replace("T", str(thickness))
    if not re.fullmatch(r"[0-9.+*()\-/ ]+", expression):
        raise ValueError(expression)
    return round(float(eval(expression, {"__builtins__": {}}, {})), 3)


entities = [e for e in ezdxf.readfile(ROUTER / "Librero pared.dxf").modelspace() if e.dxftype() == "LWPOLYLINE"]
side_entities = [e for e in entities if near(e, 150, 1200)]
front_outer = next(e for e in entities if near(e, 564, 100))
front_slot = next(e for e in entities if near(e, 500, 50))
base_entity = next(e for e in entities if near(e, 564, 131.5))
fund_entities = [e for e in entities if near(e, 564, 80)]
assert len(side_entities) == 2 and len(fund_entities) == 3

# El DXF exporta los círculos con X opuesta al contorno. Para el visor se usa
# un perfil local común, con frente en profundidad 0 y pared en 150.
side_outline = normalized(side_entities[0])
front_box = bounds(front_outer)
front_slot_points = [[round(x-front_box[0], 3), round(y-front_box[1], 3)] for x, y in points(front_slot)]
profiles = {
    "lateral": {"outline": side_outline, "width": 150.0, "height": 1200.0},
    "frente": {"outline": normalized(front_outer), "holes": [front_slot_points], "width": 564.0, "height": 100.0},
    "base": {"outline": normalized(base_entity), "width": 564.0, "height": 131.5},
    "fondo": {"outline": normalized(fund_entities[0]), "width": 564.0, "height": 80.0},
}

programs = {}
for path in sorted(FLEX.glob("MA*.xml")):
    root = ET.parse(path).getroot()
    panel = root.find("PANEL")
    length = float(panel.findtext("PanelLength"))
    width = float(panel.findtext("PanelWidth"))
    thickness = float(panel.findtext("PanelThickness"))
    ops = []
    for cad in root.findall("CAD"):
        ops.append({
            "type": cad.findtext("TypeName"),
            "x": numeric(cad.findtext("X1"), length, width, thickness),
            "y": numeric(cad.findtext("Y1"), length, width, thickness),
            "z": numeric(cad.findtext("Z1"), length, width, thickness) if cad.find("Z1") is not None else None,
            "diameter": float(cad.findtext("Diameter")),
            "depth": numeric(cad.findtext("Depth"), length, width, thickness),
            "quadrant": cad.findtext("Quadrant"),
        })
    programs[path.name] = {"length": length, "width": width, "thickness": thickness, "operations": ops}


def piece_ops(kind, side=0):
    if kind == "lateral":
        source = programs["MA000904000601180101.xml"]["operations"]
        y0 = 0 if side == 0 else 154.4
        result = []
        for op in source:
            local_y = op["y"]-y0
            if -.1 <= local_y <= 150.1:
                result.append({**op, "x": op["x"], "y": round(local_y, 3)})
        return result
    if kind in {"frente", "base"}:
        source = programs["MA000904000602180101.xml"]["operations"]
        y0, y1 = (0, 100) if kind == "frente" else (104.4, 235.9)
        return [{**op, "y": round(op["y"]-y0, 3)} for op in source if y0-.1 <= op["y"] <= y1+.1]
    source = programs["MA000904000603180101.xml"]["operations"]
    y0 = (0, 84.4, 168.8)[side]
    return [{**op, "y": round(op["y"]-y0, 3)} for op in source if y0-.1 <= op["y"] <= y0+80.1]


pieces = {
    "lateral-izquierdo": piece_ops("lateral", 0),
    "lateral-derecho": piece_ops("lateral", 1),
    "frente": piece_ops("frente"),
    "base": piece_ops("base"),
    "fondo-1": piece_ops("fondo", 0),
    "fondo-2": piece_ops("fondo", 1),
    "fondo-3": piece_ops("fondo", 2),
}

data = {
    "product": "Librero Pared Emi", "code": "MA0009040006", "thickness": 18.5,
    "profiles": profiles, "programs": programs, "pieces": pieces,
    "assembly": {
        "baseCentersY": [47.75, 471.25, 894.75],
        "frontBottomY": [38.5, 462.0, 885.5],
        "backBottomY": [382.0, 805.5, 1120.0],
        "insideWidth": 564.0, "outsideWidth": 601.0, "depth": 150.0,
    },
    "registration": {
        "lateral": "alto local = XML X; profundidad local = XML Y de cada mitad",
        "frontBase": "frente Y 0..100; base Y 104.4..235.9; base invertida en profundidad al montar",
        "backs": "tres bandas de 80 mm en Y 0..80, 84.4..164.4 y 168.8..248.8",
        "dxf": "los círculos DXF usan X con signo opuesto a los contornos",
    },
    "source": [str(ROUTER / "Librero Pared.art"), str(ROUTER / "Librero pared.dxf"), *[str(p) for p in sorted(FLEX.glob("MA*.xml"))]],
}
OUT.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
print(OUT)
print({k: len(v) for k, v in pieces.items()})
