# Med Clarity Dashboard

## Production setup

1. Create your production env file from the example:

```bash
cp .env.production.example .env.production
```

2. Fill all required `VITE_FIREBASE_*` and `VITE_N8N_WEBHOOK_URL` values.

## Production scripts

- `npm run build` – type-check and build production assets into `dist/`
- `npm run start` – serve the built app with Vite preview on `0.0.0.0:4173`
- `npm run prod` – run build then start preview server
