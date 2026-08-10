# Female Model Lab v0.1

Völlig unabhängiger Testblock. Der Harness-Designer wurde nicht verändert.

## Enthalten
- `female_custom_morph.glb`
- `index.html`
- `model_report.json`

## Modell
Aus den gelieferten FBX-Varianten wurde ein einzelnes Morph-GLB erzeugt.

- 18.004 Vertices
- 36.004 Dreiecke
- identische Topologie in allen verwendeten Varianten
- weißes mattes Material
- keine Texturen
- keine Augen
- keine Zähne

Morph Targets:
- Muscular
- Overweight
- Skinny
- ArmsStraight
- ArmsDown

Für die drei Body-Morphs bleibt das Gesicht der Caucasian-Basis erhalten:
Morph-Deltas werden zwischen 150 und 160 cm Körperhöhe weich ausgeblendet.
So verändert ein Body-Regler nicht gleichzeitig ungewollt das Gesicht.

## Start
Auf GitHub Pages oder über einen lokalen Webserver öffnen.
Wegen Browser-Sicherheitsregeln funktioniert `index.html` nicht zuverlässig per file://.

Beispiel:
`python -m http.server 8000`

Dann `http://localhost:8000` öffnen.

## Nächster Schritt
Wenn dieser Morph-Test sauber aussieht, kann der Modellblock später separat in
den Harness Designer integriert werden. Die Harness-/Riemenlogik muss dafür
nicht neu geschrieben werden.
