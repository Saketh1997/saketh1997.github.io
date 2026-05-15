/* ----------------------------------------------------------------
   chatbot.js — floating chat widget
   To connect your LLM: replace CHAT_API_URL with your endpoint.
   Expected: POST JSON { messages: [{role, content}] }
             Response JSON { reply: "..." }
   ---------------------------------------------------------------- */

const CHAT_API_URL = '/api/chat'; // ← swap in your LLM endpoint

(function () {
  const widget   = document.getElementById('chat-widget');
  const toggle   = document.getElementById('chat-toggle');
  const panel    = document.getElementById('chat-panel');
  const messages = document.getElementById('chat-messages');
  const input    = document.getElementById('chat-input');
  const sendBtn  = document.getElementById('chat-send');

  // Conversation history sent to the API each turn
  const history = [
    {
      role: 'system',
      content: `You are Saketh Metta's AI assistant on his personal website.
Answer questions about his research (PostgreSQL internals, distributed systems),
projects, homelab infrastructure, and CS background at Oregon State University.
Be concise, friendly, and technically precise. If you don't know something specific,
say so honestly.`
    }
  ];

  let open = false;
  let busy = false;

  /* -- Toggle panel ------------------------------------------------ */
  toggle.addEventListener('click', () => {
    open = !open;
    widget.classList.toggle('open', open);
    panel.setAttribute('aria-hidden', String(!open));
    if (open) {
      setTimeout(() => input.focus(), 280);
      scrollBottom();
    }
  });

  /* -- Send on Enter ----------------------------------------------- */
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  });
  sendBtn.addEventListener('click', send);

  /* -- Send message ------------------------------------------------ */
  async function send() {
    const text = input.value.trim();
    if (!text || busy) return;

    busy = true;
    sendBtn.disabled = true;
    input.value = '';

    appendMsg('user', text);
    history.push({ role: 'user', content: text });

    const typingEl = appendTyping();

    try {
      const res = await fetch(CHAT_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history })
      });

      typingEl.remove();

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      const reply = data.reply ?? data.content ?? data.message ?? '(no response)';

      history.push({ role: 'assistant', content: reply });
      appendMsg('bot', reply);

    } catch (err) {
      typingEl.remove();
      appendMsg('bot', 'Something went wrong — please try again.', true);
      // Roll back the failed user turn so history stays clean
      history.pop();
    }

    busy = false;
    sendBtn.disabled = false;
    input.focus();
  }

  /* -- DOM helpers ------------------------------------------------- */
  function appendMsg(role, text, isError = false) {
    const row = document.createElement('div');
    row.className = `chat-msg ${role}`;
    const bubble = document.createElement('div');
    bubble.className = 'msg-bubble' + (isError ? ' error' : '');
    bubble.textContent = text;
    row.appendChild(bubble);
    messages.appendChild(row);
    scrollBottom();
    return row;
  }

  function appendTyping() {
    const row = document.createElement('div');
    row.className = 'chat-msg bot typing';
    row.innerHTML = `<div class="msg-bubble">
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
    </div>`;
    messages.appendChild(row);
    scrollBottom();
    return row;
  }

  function scrollBottom() {
    messages.scrollTop = messages.scrollHeight;
  }
})();
