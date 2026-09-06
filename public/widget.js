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
    iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`;
  } else if (botConfig.icon === 'sparkles') {
    iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path></svg>`;
  } else {
    // Default bot icon
    iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"></rect><path d="M12 8v4"></path><path d="M8 12h8"></path></svg>`;
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
    .cb-msg { padding: 12px 16px; border-radius: 12px; max-width: 85%; font-size: 14px; line-height: 1.5; }
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
