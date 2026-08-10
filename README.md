# Body Model Lab v0.3a

Weiterhin komplett getrennt vom Harness Designer.

Neu gegenüber v0.2:
- Taille: schmal ↔ breit
- Hüfte: schmal ↔ breit
- Brust/Brustkorb: klein ↔ groß
- Gesäß: flach ↔ voll

Diese acht Richtungen sind echte zusätzliche Morph Targets im GLB:
WaistNarrow/Wide, HipsNarrow/Wide, BustSmall/Large, ButtFlat/Full.

Die Übergänge sind räumlich weich maskiert, sodass keine harten Ringe/Kanten
zwischen deformierter und unveränderter Geometrie entstehen.

Male und Female besitzen dieselben Regler. Beim Male-Modell ist der Einfluss
im Viewer konservativer skaliert, ohne dafür ein zweites System zu benötigen.

Die bisherigen Morphs für Körperform, Muskulatur, Arme und Beine bleiben erhalten.


## UI v0.3a
- Harness-Designer-artiges Bottom-Sheet
- große Grab-Zone oben
- frei hoch/runterziehbar
- minimale Höhe 118 px
- maximale Höhe 82 % der Bildschirmhöhe
- Inhalt scrollt innerhalb des Panels
- gewählte Panelhöhe wird lokal gespeichert
