# MRTGusser
A game by Seshpenguin and MeloQueen

Backend is in the `backend/` folder. Frontend is in the `mrtguessr/` folder.

Run the game locally by running
```bash
docker compose up --build
```

## Architecture
The backend for MRTGuessr is a Python Flask server which is responsible for serving round data, game assets/graphics, and calculating scores. It uses PostgreSQL as the database.

The frontend is a React app built with the TanStack Start framework (incl. Tailwind, Shadcn, TanStack Query, etc).

> Some of the code in this repo was built wih Claude Code
