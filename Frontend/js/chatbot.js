class ChatbotWidget {
  constructor() {
    this.API_URL = (window.EMPLOYER_API_BASE || window.ADMIN_API_BASE || 'http://localhost:3000/api').replace(/\/employer$|\/admin$/, '') + '/chat';
    this.isOpen = false;
    this.history = [];
    this.isTyping = false;
    
    // Determine user role if possible
    this.userRole = "guest";
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      if (user && user.role) {
        this.userRole = user.role;
      }
    } catch (e) {}

    this.init();
  }

  init() {
    // Inject HTML
    const container = document.createElement('div');
    container.innerHTML = `
      <!-- Chat FAB -->
      <div id="chatbot-fab" aria-label="Open chat" role="button">
        <span class="material-symbols-outlined chat-icon">chat</span>
        <span class="material-symbols-outlined close-icon">close</span>
      </div>

      <!-- Chat Window -->
      <div id="chatbot-window">
        <div id="chatbot-header">
          <div class="bot-avatar">
            <span class="material-symbols-outlined">smart_toy</span>
          </div>
          <div class="bot-info">
            <h3>SkillBridge Support</h3>
            <p>Always here to help</p>
          </div>
        </div>
        
        <div id="chatbot-messages">
          <div class="chat-message bot">
            Hi there! 👋 I'm the SkillBridge AI assistant. How can I help you today?
          </div>
          <div id="chatbot-typing" class="typing-indicator">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
          </div>
        </div>

        <div id="chatbot-input-container">
          <input type="text" id="chatbot-input" placeholder="Type your message..." autocomplete="off" />
          <button id="chatbot-send-btn" aria-label="Send message">
            <span class="material-symbols-outlined">send</span>
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(container);

    // Get elements
    this.fab = document.getElementById('chatbot-fab');
    this.window = document.getElementById('chatbot-window');
    this.messagesContainer = document.getElementById('chatbot-messages');
    this.typingIndicator = document.getElementById('chatbot-typing');
    this.input = document.getElementById('chatbot-input');
    this.sendBtn = document.getElementById('chatbot-send-btn');

    // Add event listeners
    this.fab.addEventListener('click', () => this.toggleChat());
    this.sendBtn.addEventListener('click', () => this.sendMessage());
    this.input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.sendMessage();
    });
  }

  toggleChat() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.window.classList.add('open');
      this.fab.classList.add('active');
      this.input.focus();
    } else {
      this.window.classList.remove('open');
      this.fab.classList.remove('active');
    }
  }

  appendMessage(text, sender = 'user') {
    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-message ${sender}`;
    
    // Basic markdown parsing for bold and bullet points
    let formattedText = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n\n/g, '<br><br>');
      
    // Handle bullet points
    if (formattedText.includes('* ')) {
      const lines = formattedText.split('\n');
      let inList = false;
      formattedText = lines.map(line => {
        if (line.trim().startsWith('* ')) {
          const li = `<li>${line.replace('* ', '')}</li>`;
          if (!inList) {
            inList = true;
            return `<ul>${li}`;
          }
          return li;
        } else if (inList) {
          inList = false;
          return `</ul>${line}`;
        }
        return line;
      }).join('\n');
      if (inList) formattedText += '</ul>';
    }

    msgDiv.innerHTML = formattedText;
    
    // Insert before typing indicator
    this.messagesContainer.insertBefore(msgDiv, this.typingIndicator);
    this.scrollToBottom();

    // Add to history
    if (sender !== 'system') {
      this.history.push({ role: sender === 'bot' ? 'assistant' : 'user', content: text });
    }
  }

  scrollToBottom() {
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  setTyping(isTyping) {
    this.isTyping = isTyping;
    if (isTyping) {
      this.typingIndicator.classList.add('active');
      this.sendBtn.disabled = true;
    } else {
      this.typingIndicator.classList.remove('active');
      this.sendBtn.disabled = false;
      this.input.focus();
    }
    this.scrollToBottom();
  }

  async sendMessage() {
    const text = this.input.value.trim();
    if (!text || this.isTyping) return;

    this.input.value = '';
    this.appendMessage(text, 'user');
    this.setTyping(true);

    try {
      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: this.history.slice(-10), // Send last 10 messages for context
          role: this.userRole
        })
      });

      const data = await response.json();

      if (response.ok) {
        this.appendMessage(data.reply, 'bot');
      } else {
        this.appendMessage(data.message || 'Sorry, I encountered an error.', 'bot');
      }
    } catch (error) {
      console.error('Chatbot error:', error);
      this.appendMessage('Network error. Please make sure you are connected to the internet.', 'bot');
    } finally {
      this.setTyping(false);
    }
  }
}

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new ChatbotWidget());
} else {
  new ChatbotWidget();
}
