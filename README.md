# Ecopay Frontend

This is the frontend for the Ecopay project (React + Vite + TypeScript). The UI design system originates from Figma: https://www.figma.com/design/UIK50w6mBgGAFFbjIWwzpJ/EcoSplit-Design-System--Copy-.

## Running the code

Run `npm i` to install the dependencies.

Run `npm run dev` to start the development server.

## Build

```bash
npm run build
```

Output is written to `dist/`.

## Docker

A production Dockerfile based on nginx is provided. Build with:

```bash
docker build -t ecopay-frontend .
```

The Vite build accepts `VITE_API_BASE_URL` (default `/api/v1`) as a build-arg.
