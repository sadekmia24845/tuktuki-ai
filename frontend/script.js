/* ==========================================================================
   Tuktuki AI — Frontend Logic
   ========================================================================== */

// >>> CHANGE THIS AFTER DEPLOYING YOUR BACKEND TO RENDER <<<
const API_URL = "https://tuktuki-ai-1.onrender.com/chat";

/* ---------------- State ---------------- */

const STORAGE_KEY = "tuktuki_ai_chats_v1";
const THEME_KEY = "tuktuki_ai_theme";

let state = {
  chats: {},        // { id: { id, title, messages: [{role, content}], createdAt } }
  activeChatId: null
};

let isStreaming = false;

/* ---------------- DOM refs ---------------- */

const sidebar = document.getElementById("sidebar");
const sidebarOverlay = document.getElementById("sidebarOverlay");
const menuBtn = document.getElementById("menuBtn");
const closeSidebarBtn = document.getElementById("closeSidebarBtn");
const newChatBtn = document.getElementById("newChatBtn");
const historyList = document.getElementById("historyList");
const clearAllBtn = document.getElementById("clearAllBtn");
const chatWrapper = document.getElementById("chatWrapper");
const messagesEl = document.getElementById("messages");
const emptyState = document.getElementById("emptyState");
const suggestions = document.getElementById("suggestions");
const promptInput = document.getElementById("promptInput");
const sendBtn = document.getElementById("sendBtn");
const topbarTitle = document.getElementById("topbarTitle");
const themeToggleBtn = document.getElementById("themeToggleBtn");

/* ---------------- Init ---------------- */

function init() {
  loadChats();
  loadTheme();
  bindEvents();

  const ids = Object.keys(state.chats);
  if (ids.length === 0) {
    createNewChat();
  } else {
    // Restore most recent chat
    const sorted = ids.sort((a, b) => state.chats[b].createdAt - state.chats[a].createdAt);
    state.activeChatId = sorted[0];
    renderHistory();
    renderActiveChat();
  }

  autoResizeTextarea();
}

/* ---------------- Storage ---------------- */

function loadChats() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      state.chats = parsed.chats || {};
      state.activeChatId = parsed.activeChatId || null;
    }
  } catch (e) {
    console.error("Failed to load chats", e);
    state.chats = {};
  }
}

function saveChats() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ chats: state.chats, activeChatId: state.activeChatId })
    );
  } catch (e) {
    console.error("Failed to save chats", e);
  }
}

function loadTheme() {
  const theme = localStorage.getItem(THEME_KEY) || "dark";
  document.documentElement.setAttribute("data-theme", theme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme") || "dark";
  const next = current === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem(THEME_KEY, next);
}

/* ---------------- Chat management ---------------- */

function createNewChat() {
  const id = "chat_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
  state.chats[id] = {
    id,
    title: "New Chat",
    messages: [],
    createdAt: Date.now()
  };
  state.activeChatId = id;
  saveChats();
  renderHistory();
  renderActiveChat();
  closeSidebarMobile();
  promptInput.focus();
}

function switchChat(id) {
  if (!state.chats[id]) return;
  state.activeChatId = id;
  saveChats();
  renderHistory();
  renderActiveChat();
  closeSidebarMobile();
}

function deleteChat(id, evt) {
  if (evt) evt.stopPropagation();
  delete state.chats[id];

  const ids = Object.keys(state.chats);
  if (state.activeChatId === id) {
    if (ids.length > 0) {
      const sorted = ids.sort((a, b) => state.chats[b].createdAt - state.chats[a].createdAt);
      state.activeChatId = sorted[0];
    } else {
      state.activeChatId = null;
    }
  }

  saveChats();

  if (!state.activeChatId) {
    createNewChat();
  } else {
    renderHistory();
    renderActiveChat();
  }
}

function clearAllChats() {
  if (!confirm("Delete all chat history? This cannot be undone.")) return;
  state.chats = {};
  state.activeChatId = null;
  saveChats();
  createNewChat();
  showToast("All chats cleared");
}

function getActiveChat() {
  return state.chats[state.activeChatId] || null;
}

function updateChatTitleFromFirstMessage(chat, text) {
  if (chat.title === "New Chat") {
    const trimmed = text.trim().replace(/\s+/g, " ");
    chat.title = trimmed.length > 42 ? trimmed.slice(0, 42) + "…" : trimmed;
  }
}

/* ---------------- Rendering ---------------- */

function renderHistory() {
  historyList.innerHTML = "";
  const ids = Object.keys(state.chats).sort(
    (a, b) => state.chats[b].createdAt - state.chats[a].createdAt
  );

  if (ids.length === 0) {
    const empty = document.createElement("div");
    empty.style.cssText = "color:var(--text-2);font-size:13px;padding:10px;";
    empty.textContent = "No chats yet";
    historyList.appendChild(empty);
    return;
  }

  ids.forEach((id) => {
    const chat = state.chats[id];
    const item = document.createElement("div");
    item.className = "history-item" + (id === state.activeChatId ? " active" : "");
    item.addEventListener("click", () => switchChat(id));

    const text = document.createElement("span");
    text.className = "history-item-text";
    text.textContent = chat.title || "New Chat";

    const del = document.createElement("span");
    del.className = "history-item-delete";
    del.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>`;
    del.addEventListener("click", (e) => deleteChat(id, e));

    item.appendChild(text);
    item.appendChild(del);
    historyList.appendChild(item);
  });
}

function renderActiveChat() {
  const chat = getActiveChat();
  messagesEl.innerHTML = "";

  if (!chat || chat.messages.length === 0) {
    emptyState.style.display = "flex";
    topbarTitle.textContent = "New Chat";
    return;
  }

  emptyState.style.display = "none";
  topbarTitle.textContent = chat.title || "New Chat";

  chat.messages.forEach((msg) => {
    appendMessageToDOM(msg.role, msg.content, false);
  });

  scrollToBottom(false);
}

/* ---------------- Message rendering helpers ---------------- */

function renderMarkdown(text) {
  try {
    marked.setOptions({
      breaks: true,
      gfm: true
    });
    const rawHtml = marked.parse(text || "");
    return DOMPurify.sanitize(rawHtml);
  } catch (e) {
    console.error("Markdown render error", e);
    return escapeHtml(text);
  }
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function enhanceCodeBlocks(container) {
  const pres = container.querySelectorAll("pre");
  pres.forEach((pre) => {
    if (pre.parentElement.classList.contains("code-block-wrapper")) return;

    const codeEl = pre.querySelector("code");
    let lang = "text";
    if (codeEl && codeEl.className) {
      const match = codeEl.className.match(/language-(\w+)/);
      if (match) lang = match[1];
    }

    const wrapper = document.createElement("div");
    wrapper.className = "code-block-wrapper";

    const header = document.createElement("div");
    header.className = "code-block-header";

    const langLabel = document.createElement("span");
    langLabel.textContent = lang;

    const copyBtn = document.createElement("button");
    copyBtn.className = "copy-btn";
    copyBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg><span>Copy</span>`;

    copyBtn.addEventListener("click", () => {
      const codeText = codeEl ? codeEl.innerText : pre.innerText;
      navigator.clipboard.writeText(codeText).then(() => {
        copyBtn.classList.add("copied");
        copyBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg><span>Copied</span>`;
        setTimeout(() => {
          copyBtn.classList.remove("copied");
          copyBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg><span>Copy</span>`;
        }, 1600);
      });
    });

    header.appendChild(langLabel);
    header.appendChild(copyBtn);

    pre.parentNode.insertBefore(wrapper, pre);
    wrapper.appendChild(header);
    wrapper.appendChild(pre);

    if (codeEl && window.hljs) {
      try {
        hljs.highlightElement(codeEl);
      } catch (e) {}
    }
  });
}

function appendMessageToDOM(role, content, animate = true) {
  emptyState.style.display = "none";

  const msgEl = document.createElement("div");
  msgEl.className = "msg " + role;
  if (!animate) msgEl.style.animation = "none";

  const avatar = document.createElement("div");
  avatar.className = "avatar " + (role === "user" ? "avatar-user" : "avatar-ai");
  avatar.textContent = role === "user" ? "U" : "T";

  const contentWrap = document.createElement("div");
  contentWrap.className = "msg-content";

  const roleLabel = document.createElement("div");
  roleLabel.className = "msg-role";
  roleLabel.textContent = role === "user" ? "You" : "Tuktuki AI";

  const textEl = document.createElement("div");
  textEl.className = "msg-text";
  textEl.innerHTML = renderMarkdown(content);

  contentWrap.appendChild(roleLabel);
  contentWrap.appendChild(textEl);

  if (role === "assistant") {
    const actions = document.createElement("div");
    actions.className = "msg-actions";
    const copyMsgBtn = document.createElement("button");
    copyMsgBtn.className = "msg-action-btn";
    copyMsgBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg><span>Copy</span>`;
    copyMsgBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(content).then(() => showToast("Copied to clipboard"));
    });
    actions.appendChild(copyMsgBtn);
    contentWrap.appendChild(actions);
  }

  msgEl.appendChild(avatar);
  msgEl.appendChild(contentWrap);
  messagesEl.appendChild(msgEl);

  enhanceCodeBlocks(textEl);

  return { msgEl, textEl };
}

function scrollToBottom(smooth = true) {
  chatWrapper.scrollTo({
    top: chatWrapper.scrollHeight,
    behavior: smooth ? "smooth" : "auto"
  });
}

/* ---------------- Toast ---------------- */

let toastTimeout;
function showToast(message) {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove("show"), 2200);
}

/* ---------------- Sending messages ---------------- */

async function sendMessage(text) {
  const trimmed = (text || "").trim();
  if (!trimmed || isStreaming) return;

  const chat = getActiveChat();
  if (!chat) return;

  updateChatTitleFromFirstMessage(chat, trimmed);

  chat.messages.push({ role: "user", content: trimmed });
  appendMessageToDOM("user", trimmed);
  saveChats();
  renderHistory();
  topbarTitle.textContent = chat.title;

  promptInput.value = "";
  autoResizeTextarea();
  updateSendButtonState();
  scrollToBottom();

  isStreaming = true;

  // Typing indicator bubble
  const { msgEl, textEl } = appendMessageToDOM("assistant", "", true);
  textEl.innerHTML = `<div class="typing-indicator"><span></span><span></span><span></span></div>`;
  scrollToBottom();

  try {
    const history = chat.messages.slice(0, -1).map((m) => ({
      role: m.role,
      content: m.content
    }));

    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: trimmed,
        history: history
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Server error: ${response.status}`);
    }

    const contentType = response.headers.get("content-type") || "";

    let fullText = "";

    if (contentType.includes("text/event-stream") || contentType.includes("application/octet-stream")) {
      // Streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop();

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine || !trimmedLine.startsWith("data:")) continue;
          const dataStr = trimmedLine.replace(/^data:\s*/, "");
          if (dataStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.text) {
              fullText += parsed.text;
              textEl.innerHTML = renderMarkdown(fullText) + '<span class="cursor-blink"></span>';
              enhanceCodeBlocks(textEl);
              scrollToBottom();
            }
            if (parsed.error) {
              throw new Error(parsed.error);
            }
          } catch (e) {
            // ignore parse errors on partial chunks
          }
        }
      }
    } else {
      // Plain JSON response
      const data = await response.json();
      fullText = data.reply || data.text || "";
    }

    if (!fullText) {
      fullText = "_I couldn't generate a response. Please try again._";
    }

    textEl.innerHTML = renderMarkdown(fullText);
    enhanceCodeBlocks(textEl);

    // Add copy action now that content is final
    const contentWrap = textEl.parentElement;
    if (!contentWrap.querySelector(".msg-actions")) {
      const actions = document.createElement("div");
      actions.className = "msg-actions";
      const copyMsgBtn = document.createElement("button");
      copyMsgBtn.className = "msg-action-btn";
      copyMsgBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg><span>Copy</span>`;
      copyMsgBtn.addEventListener("click", () => {
        navigator.clipboard.writeText(fullText).then(() => showToast("Copied to clipboard"));
      });
      actions.appendChild(copyMsgBtn);
      contentWrap.appendChild(actions);
    }

    chat.messages.push({ role: "assistant", content: fullText });
    saveChats();
  } catch (err) {
    console.error(err);
    textEl.innerHTML = renderMarkdown(
      `⚠️ **Error:** ${err.message || "Something went wrong while contacting the AI server."}`
    );
    chat.messages.push({
      role: "assistant",
      content: `⚠️ Error: ${err.message || "Something went wrong."}`
    });
    saveChats();
    showToast("Failed to get response");
  } finally {
    isStreaming = false;
    scrollToBottom();
  }
}

/* ---------------- Input handling ---------------- */

function autoResizeTextarea() {
  promptInput.style.height = "auto";
  promptInput.style.height = Math.min(promptInput.scrollHeight, 200) + "px";
}

function updateSendButtonState() {
  sendBtn.disabled = promptInput.value.trim().length === 0 || isStreaming;
}

/* ---------------- Sidebar mobile ---------------- */

function openSidebarMobile() {
  sidebar.classList.add("open");
  sidebarOverlay.classList.add("show");
}

function closeSidebarMobile() {
  sidebar.classList.remove("open");
  sidebarOverlay.classList.remove("show");
}

/* ---------------- Events ---------------- */

function bindEvents() {
  newChatBtn.addEventListener("click", createNewChat);
  clearAllBtn.addEventListener("click", clearAllChats);

  menuBtn.addEventListener("click", openSidebarMobile);
  closeSidebarBtn.addEventListener("click", closeSidebarMobile);
  sidebarOverlay.addEventListener("click", closeSidebarMobile);

  themeToggleBtn.addEventListener("click", toggleTheme);

  sendBtn.addEventListener("click", () => {
    sendMessage(promptInput.value);
  });

  promptInput.addEventListener("input", () => {
    autoResizeTextarea();
    updateSendButtonState();
  });

  promptInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(promptInput.value);
    }
  });

  suggestions.addEventListener("click", (e) => {
    const card = e.target.closest(".suggestion-card");
    if (!card) return;
    const prompt = card.getAttribute("data-prompt");
    promptInput.value = prompt;
    autoResizeTextarea();
    updateSendButtonState();
    sendMessage(prompt);
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 860) {
      closeSidebarMobile();
    }
  });
}

/* ---------------- Start ---------------- */

document.addEventListener("DOMContentLoaded", init);
