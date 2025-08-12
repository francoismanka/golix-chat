
let sessionId = localStorage.getItem('golix_session') || null;
const chatBox = document.getElementById('chat-box');
const input = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

function addBubble(text, who='user') {
  const div = document.createElement('div');
  div.className = 'bubble ' + (who === 'user' ? 'me' : 'bot');
  div.textContent = text;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function typing(on=true) {
  let el = document.getElementById('typing');
  if (on) {
    if (!el) {
      el = document.createElement('div');
      el.id = 'typing';
      el.className = 'bubble bot typing';
      el.textContent = 'Golix écrit…';
      chatBox.appendChild(el);
    }
  } else if (el) {
    el.remove();
  }
  chatBox.scrollTop = chatBox.scrollHeight;
}

async function sendMessage() {
  const message = input.value.trim();
  if (!message) return;
  addBubble(message, 'user');
  input.value = '';

  typing(true);
  try {
    const res = await fetch('/chat', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ message, sessionId })
    });
    const data = await res.json();
    typing(false);
    if (data.sessionId && !sessionId) {
      sessionId = data.sessionId;
      localStorage.setItem('golix_session', sessionId);
    }
    addBubble(data.reply || '(pas de réponse)', 'bot');
  } catch (e) {
    typing(false);
    addBubble('Erreur de connexion au serveur Golix.', 'bot');
  }
}

sendBtn.addEventListener('click', sendMessage);
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') sendMessage();
});

// Message d'accueil
addBubble("Salut, je suis Golix. Que veux-tu faire ?", 'bot');
