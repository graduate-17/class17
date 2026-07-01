// 后端 API 地址（替换成你的 Railway 域名）
const API_BASE = 'https://server-production-e5bd.up.railway.app';

// DOM 引用
const messageList = document.getElementById('messageList');
const form = document.getElementById('messageForm');
const authorInput = document.getElementById('authorInput');
const contentInput = document.getElementById('contentInput');
const formMessage = document.getElementById('formMessage');

// 加载留言
async function loadMessages() {
  try {
    const res = await fetch(`${API_BASE}/api/messages`);
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    renderMessages(data.data);
  } catch (err) {
    messageList.innerHTML = `<div class="empty">加载失败，请刷新页面</div>`;
  }
}

function renderMessages(messages) {
  if (!messages || messages.length === 0) {
    messageList.innerHTML = `<div class="empty">还没有留言，写下第一条祝福吧</div>`;
    return;
  }
  let html = '';
  messages.forEach(msg => {
    const time = new Date(msg.created_at).toLocaleString('zh-CN');
    html += `
      <div class="message-item">
        <div class="msg-author">${escapeHtml(msg.author)}</div>
        <div class="msg-content">${escapeHtml(msg.content)}</div>
        <div class="msg-time">${time}</div>
      </div>
    `;
  });
  messageList.innerHTML = html;
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 提交留言
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const author = authorInput.value.trim();
  const content = contentInput.value.trim();
  if (!content) {
    showMessage('请填写内容', 'error');
    return;
  }
  if (content.length > 500) {
    showMessage('内容不能超过500字', 'error');
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author, content })
    });
    const data = await res.json();
    if (!data.success) {
      showMessage(data.error || '提交失败', 'error');
      return;
    }
    showMessage('祝福已送出', 'success');
    authorInput.value = '';
    contentInput.value = '';
    loadMessages();
  } catch (err) {
    showMessage('网络错误，请重试', 'error');
  }
});

function showMessage(text, type) {
  formMessage.textContent = text;
  formMessage.className = 'form-message ' + type;
  if (type === 'success') {
    setTimeout(() => {
      formMessage.textContent = '';
      formMessage.className = 'form-message';
    }, 3000);
  }
}

// 初始化
loadMessages();