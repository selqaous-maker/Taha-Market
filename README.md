# Taha Market POS

A mobile-first point-of-sale prototype for a single grocery shop. Built with React, TypeScript, Vite and IndexedDB, with a Progressive Web App manifest and local backup/export features.

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

Camera access requires HTTPS (or localhost) and browser support. Manual barcode entry is available as a fallback.

## Important

This is a prototype. The included catalog contains sample products and prices, and the default owner PIN is only for demonstration. Replace the sample data and configure a private PIN before using it for real sales. Product and sales records are stored locally in the browser on the device; export backups regularly. No online card payment is processed.
