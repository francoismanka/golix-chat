
// Chat Golix Backend - Express.js + OpenAI
const express = require('express');
const path = require('path');
const fetch = require('node-fetch');
const OpenAI = require('openai');
const crypto = require('crypto');
const app = express();

// ====== Config ======
const GARR_URL = process.env.T_GARR || 'https://golix-garr.onrender.com';
const AUTOFLUX_URL = process.env.T_AUTOFLUX || 'https://autofluxcloud.onrender.com';
const CRYPTO_URL = process.env.T_CRYPTOBOT || 'https://crypto-bot-dashboard.onrender.com';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.MODEL_NAME || 'gpt-4o-mini';
const client = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

// Mémoire légère par session (en RAM). Pour persistance, remplacer par Redis/Firebase.
const sessions = new Map(); // sessionId -> [{role, content}]

// Middlewares
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Helpers
function ensureSession(sessionId) {
  if (!sessionId) sessionId = crypto.randomUUID();
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, [{
      role: 'system',
      content:
        'Tu es Golix, l’IA Golix du projet utilisateur. Tu parles en français, style clair et direct. ' +
        'Objectif: aider l’utilisateur à avancer vite, exécuter ses commandes (AutoFlux, trading, n8n), ' +
        'et garder le contexte du chat. Tu peux proposer des améliorations si elles économisent du temps. ' +
        'Si on mentionne “autoflux” ou “trading”, tu déclenches aussi les endpoints correspondants et tu confirmes.'
    }]);
  }
  return sessionId;
}

async function runOpenAI(sessionId, userMessage) {
  if (!client) return "⚠️ OPENAI_API_KEY non défini sur le serveur.";
  const history = sessions.get(sessionId) || [];
  history.push({ role: 'user', content: userMessage });

  // Limiter l'historique pour éviter la surcharge
  const trimmed = history.slice(-20);
  sessions.set(sessionId, trimmed);

  const completion = await client.chat.completions.create({
    model: OPENAI_MODEL,
    messages: trimmed,
    temperature: 0.4,
  });

  const reply = completion.choices?.[0]?.message?.content?.trim() || "(pas de réponse)";
  trimmed.push({ role: 'assistant', content: reply });
  sessions.set(sessionId, trimmed);
  return reply;
}

// ====== Routes ======

// Chat principal
app.post('/chat', async (req, res) => {
  try {
    let { message, sessionId } = req.body || {};
    sessionId = ensureSession(sessionId);
    let actionNote = "";

    const text = (message || "").toLowerCase();

    // Détection d'actions Golix
    if (text.includes('autoflux')) {
      try { await fetch(`${AUTOFLUX_URL}/start`); actionNote += " (AutoFlux démarré ✅)"; } catch {}
    }
    if (text.includes('trading')) {
      try { await fetch(`${CRYPTO_URL}/start`); actionNote += " (Bot trading lancé ✅)"; } catch {}
    }

    // Réponse IA
    const aiReply = await runOpenAI(sessionId, message);
    res.json({ reply: aiReply + actionNote, sessionId });
  } catch (e) {
    console.error(e);
    res.status(500).json({ reply: "Erreur serveur côté Golix.", error: String(e) });
  }
});

// Endpoints utilitaires
app.get('/status', (req, res) => {
  res.json({ golix: "online", ok: true, time: new Date().toISOString(), model: OPENAI_MODEL });
});

// Keep-alive interne (évite la mise en veille)
setInterval(() => {
  fetch(`http://localhost:${process.env.PORT || 10000}/status`).catch(()=>{});
}, 120000);

// Lancement
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Chat Golix (IA) actif sur port ${PORT}`));
