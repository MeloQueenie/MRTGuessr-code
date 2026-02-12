# MRTGusser
A game by Seshpenguin and MeloQueen. Try it out at [https://mrtguessr.com](https://mrtguessr.com)!

Backend is in the `backend/` folder. Frontend is in the `mrtguessr/` folder.

To run the game, you will need a .env filled with the following variables:
```
POSTGRES_USER=user
POSTGRES_PASSWORD=password
POSTGRES_DB=mrtguessr
DATABASE_URL=postgresql://user:password@localhost:5432/mrtguessr

VITE_PUBLIC_URL=http://localhost:3000

# Optional
OAUTH_CLIENT_ID=
OAUTH_CLIENT_SECRET=
DISCORD_WEBHOOK_URL=

# Only for prod with Cloudflare
CLOUDFLARE_TOKEN=
```

> Comment out the cloudflared section in `docker-compose.yml` for local development.

Run the game locally by running
```bash
docker compose up --build
```

## Architecture
The backend for MRTGuessr is a Python Flask server which is responsible for serving round data, game assets/graphics, and calculating scores. It uses PostgreSQL as the database.

The frontend is a React app built with the TanStack Start framework (incl. Tailwind, Shadcn, TanStack Query, etc).

> Some of the code in this repo was built wih Claude Code
