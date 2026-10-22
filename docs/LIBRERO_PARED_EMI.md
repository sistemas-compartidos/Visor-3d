# Librero Pared Emi

## Fuentes

- `Librero Pared.art`: placa 1830 × 2750 mm.
- `Librero pared.dxf`: perfiles finales y ranura del frente.
- Flex `MA000904000601180101.xml`: panel de dos laterales.
- Flex `MA000904000602180101.xml`: panel de un frente y una base.
- Flex `MA000904000603180101.xml`: panel de tres fondos.

El importador reproducible es `scripts/reconstruir_librero_pared.py` y genera `src/librero-pared-data.json`.

## Registro y orientación

- Laterales: altura = X XML; profundidad = Y local de cada mitad. En escena, profundidad mundial = `150 - Y`.
- Frente: perfil ranurado al frente, centro Z = 140,75 mm. Su eje vertical se invierte para alinear los agujeros de canto con el lateral y los mecanizados de cara miran hacia el interior.
- Base: centro Y según la estación; profundidad mundial = `131,5 - Y local`; ocupa Z 0–131,5 mm, toca la cara posterior del frente y presenta los mecanizados de cara hacia abajo.
- Fondo: contra la pared, centro Z = 9,25 mm, con los mecanizados mirando hacia el interior del librero.

Los puntos de mecanizado de todas las piezas aparecen desde el inicio del movimiento de despiece.

## Coincidencias verificadas

Las tolerancias de 1,5 mm en base y frente responden a la diferencia entre la placa final de 18 mm y el espesor 18,5 mm declarado por Flex.

| Unión | Lateral | Pieza complementaria | Resultado |
|---|---|---|---|
| Frente nivel 1 | Y 71,75 / 103,75; profundidad 9,25 | Frente 65,25 / 33,25 | diferencia 1,5 mm; misma cara de unión |
| Base nivel 1 | Y 47,75; profundidad 53 / 117 | Base 33 / 97 desde panel | diferencia 1,5 mm; misma cara de unión |
| Fondo nivel 1 | Y 406 / 438; profundidad 140,75 | Fondo 24 / 56 | coincidencia exacta |
| Niveles 2 y 3 | mismas series desplazadas 423,5 mm | piezas repetidas | coincidencia conservada |

Los puntos aparecen desde el primer movimiento del despiece. A partir del 72 % se muestran también las piezas no seleccionadas para controlar el conjunto completo.

