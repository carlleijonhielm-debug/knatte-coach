# Knatte Coach

En coachapp för knatte- och ungdomsfotboll. Visuell laguppställning, speltid per
spelare och händelseregistrering.

## Kör lokalt (frivilligt)

Om du har Node.js installerat:

```bash
npm install
npm run dev
```

Öppna sedan adressen som skrivs ut (oftast http://localhost:5173).

## Deploya till Vercel

Detta projekt är gjort för att deployas direkt till [Vercel](https://vercel.com).
Vercel upptäcker automatiskt att det är ett Vite-projekt och bygger med:

- **Build command:** `npm run build`
- **Output directory:** `dist`

Inga miljövariabler behövs.

## Lägg till på telefonens hemskärm

När appen är deployad och öppnad i Safari (iPhone) eller Chrome (Android):

1. Tryck på **dela**-knappen (iPhone) eller **menyn** (Android)
2. Välj **"Lägg till på hemskärm"**
3. Appen finns nu som en ikon — öppnar i fullskärm utan adressfält

Datat sparas lokalt i mobilens browser via `localStorage`.

## Filstruktur

```
.
├── index.html              Root-HTML, Tailwind via CDN
├── package.json            Dependencies
├── vite.config.js          Vite-konfig
├── public/
│   ├── icon.svg            Hemskärmsikon
│   └── manifest.json       PWA-manifest
└── src/
    ├── main.jsx            Entry point + localStorage-polyfill
    └── App.jsx             Hela appen
```
