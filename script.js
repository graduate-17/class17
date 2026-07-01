const API_BASE = 'https://server-production-c6b8.up.railway.app';
const IMGBB_API_KEY = '0bb35dd01d42e7df850d535d2c79e8f6';

// ===== DOM 引用 =====
const leftPage = document.getElementById('leftPage');
const rightPage = document.getElementById('rightPage');
const leftContent = document.getElementById('leftContent');
const rightContent = document.getElementById('rightContent');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const pageIndicator = document.getElementById('pageIndicator');

// ===== 登录相关 DOM =====
const loginOverlay = document.getElementById('loginOverlay');
const loginForm = document.getElementById('loginForm');
const loginUsername = document.getElementById('loginUsername');
const loginPassword = document.getElementById('loginPassword');
const loginError = document.getElementById('loginError');
const userGreeting = document.getElementById('userGreeting');
const logoutBtn = document.getElementById('logoutBtn');

let allMessages = [];
let currentPage = 0;
const ITEMS_PER_PAGE = 4;

// ===== 封装的 fetch 自动携带 Cookie =====
async function apiFetch(url, options = {}) {
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  return response;
}

// ===== 检查登录状态 =====
async function checkLogin() {
  try {
    const res = await apiFetch('/api/me');
    const data = await res.json();
    if (data.success) {
      loginOverlay.classList.add('hidden');
      userGreeting.textContent = '👋 ' + data.user.username;
      logoutBtn.style.display = 'inline-block';
      return true;
    } else {
      loginOverlay.classList.remove('hidden');
      userGreeting.textContent = '未登录';
      logoutBtn.style.display = 'none';
      return false;
    }
  } catch {
    loginOverlay.classList.remove('hidden');
    userGreeting.textContent = '未登录';
    logoutBtn.style.display = 'none';
    return false;
  }
}

// ===== 登录 =====
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.style.display = 'none';
  const username = loginUsername.value.trim();
  const password = loginPassword.value.trim();

  try {
    const res = await apiFetch('/api/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (data.success) {
      await checkLogin();
      loadMessages();
      loadPhotos();
      loginUsername.value = '';
      loginPassword.value = '';
    } else {
      loginError.textContent = data.error || '登录失败';
      loginError.style.display = 'block';
    }
  } catch {
    loginError.textContent = '网络错误，请重试';
    loginError.style.display = 'block';
  }
});

// ===== 退出 =====
logoutBtn.addEventListener('click', async () => {
  await apiFetch('/api/logout', { method: 'POST' });
  await checkLogin();
  loadMessages();
  loadPhotos();
});

// ===== Tab 切换 =====
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    this.classList.add('active');
    document.getElementById('tab-' + this.dataset.tab).classList.add('active');
    if (this.dataset.tab === 'photos') loadPhotos();
  });
});

// ===== 加载留言 =====
async function loadMessages() {
  try {
    const res = await apiFetch('/api/messages');
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    allMessages = data.data || [];
    renderPage(currentPage);
    updateButtons();
  } catch (err) {
    leftContent.innerHTML = `<div class="empty-msg">加载失败，请刷新页面</div>`;
    rightContent.innerHTML = `<div class="empty-msg">加载失败，请刷新页面</div>`;
  }
}

function renderPage(pageIndex) {
  const total = Math.max(1, Math.ceil(allMessages.length / ITEMS_PER_PAGE) + 1);
  const current = Math.min(Math.max(pageIndex, 0), total - 1);

  let leftHtml = '';
  if (current === 0) {
    leftHtml = `
      <div class="cover-content">
        <div class="big-icon"><i class="fas fa-book-open"></i></div>
        <div class="big-title">留言册</div>
        <div class="divider-line"></div>
        <div class="big-sub">Class 17 · 2026</div>
      </div>
    `;
  } else {
    const start = (current - 1) * ITEMS_PER_PAGE;
    const end = Math.min(start + ITEMS_PER_PAGE, allMessages.length);
    const items = allMessages.slice(start, end);
    if (items.length === 0) leftHtml = `<div class="empty-msg">这一页是空的</div>`;
    else {
      leftHtml = items.map(msg => `
        <div class="msg-item">
          <div class="msg-author">${escapeHtml(msg.author)}</div>
          <div class="msg-content">${escapeHtml(msg.content)}</div>
          <div class="msg-time">${formatTime(msg.created_at)}</div>
        </div>
      `).join('');
    }
  }

  let rightHtml = '';
  const totalPages = Math.max(1, Math.ceil(allMessages.length / ITEMS_PER_PAGE) + 1);
  if (current === totalPages - 1) {
    rightHtml = `
      <div class="cover-content">
        <div class="big-icon"><i class="fas fa-heart"></i></div>
        <div class="big-title">愿君珍重</div>
        <div class="divider-line"></div>
        <div class="big-sub">后会有期</div>
      </div>
    `;
  } else {
    const start = current * ITEMS_PER_PAGE;
    const end = Math.min(start + ITEMS_PER_PAGE, allMessages.length);
    const items = allMessages.slice(start, end);
    if (items.length === 0) rightHtml = `<div class="empty-msg">这一页是空的</div>`;
    else {
      rightHtml = items.map(msg => `
        <div class="msg-item">
          <div class="msg-author">${escapeHtml(msg.author)}</div>
          <div class="msg-content">${escapeHtml(msg.content)}</div>
          <div class="msg-time">${formatTime(msg.created_at)}</div>
        </div>
      `).join('');
    }
  }

  const pageNumLeft = current === 0 ? '' : `<div class="page-number">${current}</div>`;
  const pageNumRight = current === totalPages - 1 ? '' : `<div class="page-number">${current + 1}</div>`;
  leftContent.innerHTML = leftHtml + pageNumLeft;
  rightContent.innerHTML = rightHtml + pageNumRight;

  leftPage.classList.remove('page-flip');
  rightPage.classList.remove('page-flip');
  void leftPage.offsetWidth;
  leftPage.classList.add('page-flip');
  rightPage.classList.add('page-flip');

  pageIndicator.textContent = `${current + 1} / ${totalPages}`;
  currentPage = current;
  updateButtons();
}

function nextPage() {
  const total = Math.max(1, Math.ceil(allMessages.length / ITEMS_PER_PAGE) + 1);
  if (currentPage < total - 1) renderPage(currentPage + 1);
}
function prevPage() {
  if (currentPage > 0) renderPage(currentPage - 1);
}
function updateButtons() {
  const total = Math.max(1, Math.ceil(allMessages.length / ITEMS_PER_PAGE) + 1);
  prevBtn.disabled = currentPage === 0;
  nextBtn.disabled = currentPage >= total - 1;
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
function formatTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ===== 提交留言 =====
const messageForm = document.getElementById('messageForm');
const authorInput = document.getElementById('authorInput');
const contentInput = document.getElementById('contentInput');
const formMessage = document.getElementById('formMessage');

messageForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const author = authorInput.value.trim();
  const content = contentInput.value.trim();
  if (!content) { showMessage('请填写内容', 'error'); return; }
  if (content.length > 500) { showMessage('内容不能超过500字', 'error'); return; }

  try {
    const res = await apiFetch('/api/messages', {
      method: 'POST',
      body: JSON.stringify({ author, content })
    });
    const data = await res.json();
    if (!data.success) { showMessage(data.error || '提交失败', 'error'); return; }
    showMessage('祝福已送出', 'success');
    authorInput.value = '';
    contentInput.value = '';
    await loadMessages();
    const total = Math.max(1, Math.ceil(allMessages.length / ITEMS_PER_PAGE) + 1);
    renderPage(total - 1);
  } catch (err) {
    showMessage('网络错误，请重试', 'error');
  }
});

function showMessage(text, type) {
  formMessage.textContent = text;
  formMessage.className = 'form-message ' + type;
  if (type === 'success') {
    setTimeout(() => { formMessage.textContent = ''; formMessage.className = 'form-message'; }, 3000);
  }
}

// ===== 照片墙 =====
async function loadPhotos() {
  const grid = document.getElementById('photoGrid');
  grid.innerHTML = '<div class="loading">加载照片中...</div>';
  try {
    const res = await apiFetch('/api/photos');
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    if (data.data.length === 0) {
      grid.innerHTML = '<div class="loading">还没有照片，上传第一张吧</div>';
      return;
    }
    grid.innerHTML = data.data.map(p => `
      <div class="photo-card" data-id="${p.id}">
        <img src="${p.url}" alt="班级合照" loading="lazy" onclick="window.open('${p.url}','_blank')">
        <div class="photo-info">
          <span class="uploader">${escapeHtml(p.uploader)}</span>
          <span class="time">${formatTime(p.created_at)}</span>
        </div>
        <button class="delete-btn" onclick="deletePhoto(${p.id})" title="删除"><i class="fas fa-times"></i></button>
      </div>
    `).join('');
  } catch (err) {
    grid.innerHTML = `<div class="loading">加载失败，请刷新页面</div>`;
  }
}

async function deletePhoto(id) {
  if (!confirm('确定要删除这张照片吗？')) return;
  try {
    const res = await apiFetch(`/api/photos/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      showPhotoMessage('已删除', 'success');
      loadPhotos();
    } else {
      showPhotoMessage(data.error || '删除失败', 'error');
    }
  } catch (err) {
    showPhotoMessage('网络错误', 'error');
  }
}

function showPhotoMessage(text, type) {
  const el = document.getElementById('photoMessage');
  el.textContent = text;
  el.className = 'form-message ' + type;
  if (type === 'success') {
    setTimeout(() => { el.textContent = ''; el.className = 'form-message'; }, 3000);
  }
}

// ===== 上传照片 =====
const photoForm = document.getElementById('photoForm');
const photoFile = document.getElementById('photoFile');
const photoUploader = document.getElementById('photoUploader');

photoForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const file = photoFile.files[0];
  if (!file) { showPhotoMessage('请选择图片', 'error'); return; }
  if (file.size > 16 * 1024 * 1024) { showPhotoMessage('图片不能超过16MB', 'error'); return; }

  showPhotoMessage('上传中...', '');
  const formData = new FormData();
  formData.append('image', file);
  formData.append('key', IMGBB_API_KEY);

  try {
    const uploadRes = await fetch('https://api.imgbb.com/1/upload', { method: 'POST', body: formData });
    const uploadData = await uploadRes.json();
    if (!uploadData.success) {
      showPhotoMessage('上传到图床失败: ' + (uploadData.error?.message || '未知错误'), 'error');
      return;
    }
    const url = uploadData.data.url;
    const uploader = photoUploader.value.trim() || '匿名同学';
    const saveRes = await apiFetch('/api/photos', {
      method: 'POST',
      body: JSON.stringify({ url, uploader })
    });
    const saveData = await saveRes.json();
    if (!saveData.success) { showPhotoMessage(saveData.error || '保存失败', 'error'); return; }
    showPhotoMessage('上传成功！', 'success');
    photoFile.value = '';
    photoUploader.value = '';
    loadPhotos();
  } catch (err) {
    showPhotoMessage('网络错误: ' + err.message, 'error');
  }
});

// ===== 键盘快捷键翻页 =====
document.addEventListener('keydown', (e) => {
  if (document.querySelector('#tab-book.active')) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); nextPage(); }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); prevPage(); }
  }
});

// ===== 初始化 =====
async function init() {
  await checkLogin();
  await loadMessages();
  await loadPhotos();
}
init();