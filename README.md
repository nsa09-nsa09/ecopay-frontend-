# EcoPay Frontend

This is the frontend for the EcoPay project (React + Vite + TypeScript). The UI design system originates from the legacy Figma design source: https://www.figma.com/design/UIK50w6mBgGAFFbjIWwzpJ/EcoSplit-Design-System--Copy-.

## Running the code

Run `npm i` to install the dependencies.

Run `npm run dev` to start the development server.

## Build

```bash
npm run build
```

Output is written to `dist/`.

## Branding

```bash
VITE_APP_NAME=EcoPay
VITE_SUPPORT_EMAIL=
VITE_INSTAGRAM_URL=
VITE_TIKTOK_URL=
```

Leave contact/social values empty until real EcoPay channels exist. The UI hides unset contact links instead of inventing addresses.

## Docker

A production Dockerfile based on nginx is provided. Build with:

```bash
docker build -t ecopay-frontend .
```

The Vite build accepts `VITE_API_BASE_URL` (default `/api/v1`) and the branding variables above as build args.
