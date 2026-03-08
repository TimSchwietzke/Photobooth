# Photobooth
### *Ein ästhetisches Fotokabinen-Erlebnis für den Browser.*

Dieses Projekt verwandelt deinen Browser in eine gemütliche, retro-inspirierte Fotokabine.

---

## Features
* **Live-Vorschau:** Echtzeit-Kamera-Feed mit optionaler Spiegelung.
* **Countdown-System:** Automatischer Ablauf für 4 aufeinanderfolgende Posen.
* **Echtzeit-Filter:** Wähle zwischen *Normal, Schwarz-Weiß, Retro* und *Vivid*.
* **Sofort-Download:** Generiert einen PNG-Streifen zum Speichern.

---

## Tech-Stack
* **HTML5 & Vanilla JavaScript:** Komplette Logik ohne schwere Frameworks.
* **Tailwind CSS v4:** Nutzung der neuesten CSS-first Engine für das Styling.
* **Google Fonts:** Nutzung von *DM Serif Display*, *Inter* und *Caveat* für den Typografie-Mix.

---

## Projektstruktur
```text
Photobooth/
├── index.html          # Hauptdatei (Struktur)
├── src/
│   ├── input.css       # Tailwind Source & Custom Styles
│   ├── script.js       # Kamera-Logik & Bildverarbeitung
│   ├── favicon.png     # Browser-Icon
│   └── ...             # Icons & Bilder
├── dist/
│   └── output.css      # Kompiliertes CSS (wird automatisch generiert)
├── package.json        # Node-Abhängigkeiten & Skripte
└── .gitignore          # Regeln für Git (node_modules etc. ignorieren)