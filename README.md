
# Chat Golix (IA)
Interface web pour discuter avec **l’IA Golix** (OpenAI) et piloter ses modules (AutoFlux, trading).

## Variables d'environnement à définir sur Render
- `OPENAI_API_KEY` : clé API OpenAI
- `MODEL_NAME` : (optionnel) ex. `gpt-4o-mini` ou `gpt-4o`
- `T_GARR` : URL publique de golix_garr
- `T_AUTOFLUX` : URL publique d'AutoFluxCloud
- `T_CRYPTOBOT` : URL publique du dashboard / bot crypto

## Déploiement
- Node (Render) : build `npm install`, start `npm start`
- Health check : `/status`

## Utilisation
- Ouvre l'URL → parle à Golix.
- Inclure le mot **"autoflux"** démarre AutoFlux.
- Inclure le mot **"trading"** lance le bot crypto.
