(async function() {
  const scriptTag = document.currentScript;
  const botId = scriptTag.getAttribute('data-bot-id');
  
  // Dynamically extract the backend URL based on where this script is hosted
  const scriptUrl = new URL(scriptTag.src);
  const BASE_URL = scriptUrl.origin;

  if (!botId) {
    console.error('Chatbot Widget: Missing data-bot-id attribute.');
    return;
  }

  // 1. Fetch the customer's custom branding
  let botConfig = { name: "AI Assistant", primary_color: "#2563eb", icon: "bot" };
  try {
    const configRes = await fetch(`${BASE_URL}/api/bot/${botId}`);
    if (configRes.ok) {
      const data = await configRes.json();
      if (data.bot) {
        if (data.bot.name) botConfig.name = data.bot.name;
        if (data.bot.primary_color) botConfig.primary_color = data.bot.primary_color;
        if (data.bot.icon) botConfig.icon = data.bot.icon;
      } else {
        if (data.name) botConfig.name = data.name;
        if (data.primary_color) botConfig.primary_color = data.primary_color;
        if (data.icon) botConfig.icon = data.icon;
      }
    }
  } catch(e) {
    console.error('Failed to load bot config.');
  }

  // 2. Determine which SVG icon to use
  let iconSvg = '';
  if (botConfig.icon === 'message') {
    iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.03 2 11c0 2.87 1.54 5.43 3.91 7.12.35.25.59.63.66 1.05.12.72.01 1.78-.4 2.65a.5.5 0 0 0 .66.66c1.64-.78 2.94-1.32 3.86-1.55.33-.08.68-.08 1.01-.01A10.74 10.74 10.74 0 0 0 12 20c5.523 0 10-4.03 10-9s-4.477-9-10-9z"/></svg>`;
  } else if (botConfig.icon === 'sparkles') {
    iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.67a2.12 2.12 0 0 0 1.155 1.156l4.67 2.31a.53.53 0 0 1 0 .95l-4.67 2.31a2.12 2.12 0 0 0-1.156 1.155l-2.31 4.67a.53.53 0 0 1-.95 0l-2.31-4.67a2.12 2.12 0 0 0-1.155-1.156l-4.67-2.31a.53.53 0 0 1 0-.95l4.67-2.31a2.12 2.12 0 0 0 1.156-1.155l2.31-4.67z"/><path d="M19.97 18.03a.35.35 0 0 1 .63 0l.69 1.39c.07.15.19.27.34.34l1.39.69a.35.35 0 0 1 0 .63l-1.39.69a.46.46 0 0 0-.34.34l-.69 1.39a.35.35 0 0 1-.63 0l-.69-1.39a.46.46 0 0 0-.34-.34l-1.39-.69a.35.35 0 0 1 0-.63l1.39-.69a.46.46 0 0 0 .34-.34l.69-1.39z"/></svg>`;
  } else {
    // Default modern robot icon
    iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a2 2 0 0 1 2 2v2h3a4 4 0 0 1 4 4v7a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-7a4 4 0 0 1 4-4h3V4a2 2 0 0 1 2-2zm3 10a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm-6 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z"/></svg>`;
  }

  // 3. Inject CSS with Dynamic Brand Color
  const style = document.createElement('style');
  style.innerHTML = `
    #chatbot-widget-container {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 999999;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }
    #chatbot-widget-button {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background-color: ${botConfig.primary_color};
      color: white;
      border: none;
      cursor: pointer;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s;
    }
    #chatbot-widget-button:hover {
      transform: scale(1.05);
    }
    #chatbot-widget-window {
      display: none;
      width: 350px;
      height: 500px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      position: absolute;
      bottom: 80px;
      right: 0;
      flex-direction: column;
      overflow: hidden;
      border: 1px solid #e5e7eb;
    }
    #chatbot-widget-header {
      background: ${botConfig.primary_color};
      color: white;
      padding: 16px;
      font-weight: 600;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    #chatbot-widget-messages {
      flex: 1;
      padding: 16px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 12px;
      background: #f9fafb;
    }
    .cb-msg { padding: 12px 16px; border-radius: 12px; max-width: 85%; font-size: 14px; line-height: 1.5; white-space: pre-wrap; }
    .cb-msg.user { background: ${botConfig.primary_color}; color: white; align-self: flex-end; border-bottom-right-radius: 2px; }
    .cb-msg.bot { background: #ffffff; color: #1f2937; align-self: flex-start; border-bottom-left-radius: 2px; border: 1px solid #e5e7eb; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); }
    #chatbot-widget-form {
      display: flex;
      padding: 12px;
      border-top: 1px solid #e5e7eb;
      background: white;
    }
    #chatbot-widget-input {
      flex: 1;
      padding: 10px 16px;
      border: 1px solid #d1d5db;
      border-radius: 9999px;
      outline: none;
      font-size: 14px;
      color: #111827;
    }
    #chatbot-widget-input:focus {
      border-color: ${botConfig.primary_color};
    }
    #chatbot-widget-submit {
      background: ${botConfig.primary_color};
      color: white;
      border: none;
      width: 40px;
      height: 40px;
      margin-left: 8px;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  `;
  document.head.appendChild(style);

  // 4. Inject Dynamic HTML
  const container = document.createElement('div');
  container.id = 'chatbot-widget-container';
  container.innerHTML = `
    <div id="chatbot-widget-window">
      <div id="chatbot-widget-header">
        <span>${botConfig.name}</span>
        <button id="chatbot-widget-close" style="background:none;border:none;color:white;cursor:pointer;font-size:24px;line-height:1;">&times;</button>
      </div>
      <div id="chatbot-widget-messages">
        <div class="cb-msg bot">Hi there! How can I help you today?</div>
      </div>
      <form id="chatbot-widget-form">
        <input type="text" id="chatbot-widget-input" placeholder="Type your question..." autocomplete="off" required>
        <button type="submit" id="chatbot-widget-submit">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
        </button>
      </form>
    </div>
    <button id="chatbot-widget-button">
      ${iconSvg}
    </button>
  `;
  document.body.appendChild(container);

  // 5. Logic
  const btn = document.getElementById('chatbot-widget-button');
  const win = document.getElementById('chatbot-widget-window');
  const closeBtn = document.getElementById('chatbot-widget-close');
  const form = document.getElementById('chatbot-widget-form');
  const input = document.getElementById('chatbot-widget-input');
  const messagesDiv = document.getElementById('chatbot-widget-messages');

  let isOpen = false;
  let hasAskedForEmail = false;
  let hasProvidedEmail = false;

  // Session ID generation
  let sessionId = localStorage.getItem('cb_session_id');
  if (!sessionId) {
    sessionId = 'sess_' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('cb_session_id', sessionId);
  }

  btn.addEventListener('click', () => {
    isOpen = !isOpen;
    win.style.display = isOpen ? 'flex' : 'none';
  });

  closeBtn.addEventListener('click', () => {
    isOpen = false;
    win.style.display = 'none';
  });

  function addMessage(text, sender) {
    const msg = document.createElement('div');
    msg.className = 'cb-msg ' + sender;
    msg.textContent = text;
    messagesDiv.appendChild(msg);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;

    addMessage(text, 'user');
    input.value = '';

    // Handle Lead Capture (Email)
    if (hasAskedForEmail && !hasProvidedEmail && text.includes('@')) {
      hasProvidedEmail = true;
      addMessage("Thanks, I've saved your email! Feel free to keep asking questions.", 'bot');
      try {
        await fetch(`${BASE_URL}/api/lead`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ botId: botId, email: text })
        });
      } catch(e) {}
      return;
    } else if (hasAskedForEmail && !hasProvidedEmail) {
      addMessage('That doesn\'t look like a valid email, but I will continue answering your questions!', 'bot');
      hasProvidedEmail = true; // Give up asking
    }

    const loadingMsg = document.createElement('div');
    loadingMsg.className = 'cb-msg bot';
    loadingMsg.textContent = 'Typing...';
    messagesDiv.appendChild(loadingMsg);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;

    try {
      const res = await fetch(`${BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botId: botId, message: text, sessionId: sessionId })
      });
      const data = await res.json();
      
      messagesDiv.removeChild(loadingMsg);
      addMessage(data.answer || data.error, 'bot');

      // Lead capture trigger after first question
      if (!hasAskedForEmail) {
        setTimeout(() => {
          addMessage('Just in case we get disconnected, what is your email address?', 'bot');
          hasAskedForEmail = true;
        }, 3000);
      }
    } catch (err) {
      messagesDiv.removeChild(loadingMsg);
      addMessage('Sorry, the server is currently unavailable.', 'bot');
    }
  });
})();
