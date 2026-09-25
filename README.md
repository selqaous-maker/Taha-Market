# Taha Market POS

A mobile-first point-of-sale prototype for one grocery shop. Built with React, TypeScript, Vite and IndexedDB, with a Progressive Web App manifest and local backup/export features.

## Run locally

Requirements: Node.js 20.19+ or 22.12+.

```sh
npm install
npm run dev
```

To create a production build:

```sh
npm run build
npm run preview
```

The GitHub Pages workflow builds and deploys the app on updates to `main`. Camera access requires HTTPS and browser support; manual barcode entry is also available.

## Before real sales

This remains a prototype. It includes sample products/prices and a demonstration owner PIN; configure real data and a private PIN before using it for checkout. Product and sales records are stored locally in the browser on the device. Export backups regularly. Card payments are not processed by the app.
