# Landing Admin Panel (React + Vite + Tailwind)

Panel de administración para el backend "Landing Forms → Telegram".

## Arranque
```bash
cp .env.example .env
# edita .env con tu VITE_API_BASE_URL y VITE_ADMIN_API_KEY

npm install
npm run dev
```

## Qué permite
- Crear clientes
- Crear landings (muestra claramente el Telegram connect URL y endpoints de formularios)
- Crear/editar formularios
- Listar submissions (por landing) y ver detalle
- "Reenviar" un lead: re-envía el `data` de la submission al endpoint de submit del mismo formulario (crea una submission nueva).
- Probar formularios: formulario de test que postea a `/forms/:landingId/:formId/submit`

> Nota: el backend actual solo expone endpoints de creación y edición de formularios, y listados básicos.
