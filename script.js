const API_BASE = 'https://caiyz.dpdns.org';
const IMGBB_API_KEY = '0bb35dd01d42e7df850d535d2c79e8f6';

// ===== DOM 引用 =====
const leftPage = document.getElementById('leftPage');
const rightPage = document.getElementById('rightPage');
const leftContent = document.getElementById('leftContent');
const rightContent = document.getElementById('rightContent');
const pageIndicator = document.getElementById('pageIndicator');

let allMessages = [];
let currentPage = 0;
const ITEMS_PER_PAGE = 4;

// ===== 封装的 fetch =====
async function apiFetch(url, options = {}) {
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  return response;
}

// ============================================================
//  Tab 切换（支持四个标签页）
// ============================================================
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    this.classList.add('active');
    const tabId = 'tab-' + this.dataset.tab;
    document.getElementById(tabId).classList.add('active');
    if (this.dataset.tab === 'photos') loadPhotos();
    if (this.dataset.tab === 'classmates') loadClassmates();
    if (this.dataset.tab === 'tree') loadTree();
  });
});

// ============================================================
//  键盘翻页
// ============================================================
document.addEventListener('keydown', function(e) {
  if (document.querySelector('#tab-book.active')) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      nextPage();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      prevPage();
    }
  }
});

// ============================================================
//  翻页函数
// ============================================================
window.prevPage = function() {
  if (currentPage > 0) {
    renderPage(currentPage - 1);
  }
};

window.nextPage = function() {
  const total = Math.max(1, Math.ceil(allMessages.length / ITEMS_PER_PAGE) + 1);
  if (currentPage < total - 1) {
    renderPage(currentPage + 1);
  }
};

// ============================================================
//  留言加载与渲染
// ============================================================
async function loadMessages() {
  try {
    const res = await apiFetch('/api/messages');
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    allMessages = data.data || [];
    renderPage(currentPage);
    updateButtons();
  } catch (err) {
    console.error('加载留言失败:', err);
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
    if (items.length === 0) {
      leftHtml = `<div class="empty-msg">这一页是空的</div>`;
    } else {
      leftHtml = items.map(msg => `
        <div class="msg-item">
          <div class="msg-author">${escapeHtml(msg.author)}</div>
          <div class="msg-content">${escapeHtml(msg.content)}</div>
          <div class="msg-time">${formatTime(msg.created_at)}</div>
        </div>
      `).join('');
    }
  }
  leftContent.innerHTML = leftHtml;

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
    if (items.length === 0) {
      rightHtml = `<div class="empty-msg">这一页是空的</div>`;
    } else {
      rightHtml = items.map(msg => `
        <div class="msg-item">
          <div class="msg-author">${escapeHtml(msg.author)}</div>
          <div class="msg-content">${escapeHtml(msg.content)}</div>
          <div class="msg-time">${formatTime(msg.created_at)}</div>
        </div>
      `).join('');
    }
  }
  rightContent.innerHTML = rightHtml;

  const pageNumLeft = current === 0 ? '' : `<div class="page-number">${current}</div>`;
  const pageNumRight = current === totalPages - 1 ? '' : `<div class="page-number">${current + 1}</div>`;
  leftContent.innerHTML += pageNumLeft;
  rightContent.innerHTML += pageNumRight;

  leftPage.classList.remove('page-flip');
  rightPage.classList.remove('page-flip');
  void leftPage.offsetWidth;
  leftPage.classList.add('page-flip');
  rightPage.classList.add('page-flip');

  pageIndicator.textContent = `${current + 1} / ${totalPages}`;
  currentPage = current;
  updateButtons();
}

function updateButtons() {
  const total = Math.max(1, Math.ceil(allMessages.length / ITEMS_PER_PAGE) + 1);
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  if (prevBtn) prevBtn.disabled = currentPage === 0;
  if (nextBtn) nextBtn.disabled = currentPage >= total - 1;
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
  return date.toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// ============================================================
//  提交留言
// ============================================================
const messageForm = document.getElementById('messageForm');
const authorInput = document.getElementById('authorInput');
const contentInput = document.getElementById('contentInput');
const formMessage = document.getElementById('formMessage');

messageForm.addEventListener('submit', async function(e) {
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
    const res = await apiFetch('/api/messages', {
      method: 'POST',
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
    setTimeout(function() {
      formMessage.textContent = '';
      formMessage.className = 'form-message';
    }, 3000);
  }
}

// ============================================================
//  照片墙
// ============================================================
const photoGrid = document.getElementById('photoGrid');

photoGrid.addEventListener('click', function(e) {
  const btn = e.target.closest('.delete-btn');
  if (btn) {
    const id = parseInt(btn.dataset.id, 10);
    deletePhoto(id);
    return;
  }
  const img = e.target.closest('.photo-card img');
  if (img) {
    const url = img.dataset.url || img.src;
    window.open(url, '_blank');
    return;
  }
});

async function loadPhotos() {
  photoGrid.innerHTML = '<div class="loading">加载照片中...</div>';
  try {
    const res = await apiFetch('/api/photos');
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    if (data.data.length === 0) {
      photoGrid.innerHTML = '<div class="loading">还没有照片，上传第一张吧</div>';
      return;
    }
    photoGrid.innerHTML = data.data.map(function(p) {
      return `
        <div class="photo-card" data-id="${p.id}">
          <img src="${p.url}" alt="班级合照" loading="lazy" data-url="${p.url}">
          <div class="photo-info">
            <span class="uploader">${escapeHtml(p.uploader)}</span>
            <span class="time">${formatTime(p.created_at)}</span>
          </div>
          <button class="delete-btn" data-id="${p.id}" title="删除">
            <i class="fas fa-times"></i>
          </button>
        </div>
      `;
    }).join('');
  } catch (err) {
    photoGrid.innerHTML = '<div class="loading">加载失败，请刷新页面</div>';
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
    setTimeout(function() {
      el.textContent = '';
      el.className = 'form-message';
    }, 3000);
  }
}

// ============================================================
//  上传照片
// ============================================================
const photoForm = document.getElementById('photoForm');
const photoFile = document.getElementById('photoFile');
const photoUploader = document.getElementById('photoUploader');

photoForm.addEventListener('submit', async function(e) {
  e.preventDefault();
  const file = photoFile.files[0];
  if (!file) {
    showPhotoMessage('请选择图片', 'error');
    return;
  }
  if (file.size > 16 * 1024 * 1024) {
    showPhotoMessage('图片不能超过16MB', 'error');
    return;
  }

  showPhotoMessage('上传中...', '');
  const formData = new FormData();
  formData.append('image', file);
  formData.append('key', IMGBB_API_KEY);

  try {
    const uploadRes = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: formData
    });
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
    if (!saveData.success) {
      showPhotoMessage(saveData.error || '保存失败', 'error');
      return;
    }
    showPhotoMessage('上传成功！', 'success');
    photoFile.value = '';
    photoUploader.value = '';
    loadPhotos();
  } catch (err) {
    showPhotoMessage('网络错误: ' + err.message, 'error');
  }
});

// ============================================================
//  同学录
// ============================================================
async function loadClassmates() {
  const container = document.getElementById('classmatesContainer');
  container.innerHTML = '<div class="loading">加载中...</div>';
  try {
    const res = await apiFetch('/api/classmates');
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    renderClassmates(data.data);
  } catch (err) {
    console.error('加载同学录失败:', err);
    container.innerHTML = `<div class="loading">加载失败：${err.message}</div>`;
  }
}

function renderClassmates(classmates) {
  const container = document.getElementById('classmatesContainer');

  // 模态框
  if (!document.getElementById('classmateModal')) {
    const modalHTML = `
      <div id="classmateModal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); z-index:1000; justify-content:center; align-items:center;">
        <div style="background:#fcf8f0; border-radius:16px; padding:24px; max-width:360px; width:90%; box-shadow:0 8px 24px rgba(0,0,0,0.3); position:relative;">
          <button class="modal-close-btn" style="position:absolute; top:8px; right:12px; background:none; border:none; font-size:1.6rem; cursor:pointer; color:#2d2a24; line-height:1;">&times;</button>
          <h3 style="margin-bottom:12px; color:#2d2a24;">学号 <span id="modalId"></span></h3>
          <div id="modalViewMode">
            <p style="margin-bottom:6px;"><strong>姓名：</strong><span id="modalName"></span></p>
            <p><strong>联系方式：</strong><span id="modalContact"></span></p>
          </div>
          <div id="modalEditMode" style="display:none;">
            <div class="form-group" style="margin-bottom:10px;">
              <label style="font-weight:500; font-size:0.9rem;">姓名</label>
              <input type="text" id="modalEditName" placeholder="姓名" maxlength="20" style="width:100%; padding:8px 12px; border:1px solid #ddd2c2; border-radius:6px; background:#fff; color:#2d2a24; font-size:0.95rem; box-sizing:border-box;">
            </div>
            <div class="form-group" style="margin-bottom:10px;">
              <label style="font-weight:500; font-size:0.9rem;">联系方式</label>
              <input type="text" id="modalEditContact" placeholder="手机/QQ/微信" maxlength="50" style="width:100%; padding:8px 12px; border:1px solid #ddd2c2; border-radius:6px; background:#fff; color:#2d2a24; font-size:0.95rem; box-sizing:border-box;">
            </div>
          </div>
          <div id="modalActions" style="margin-top:16px; text-align:right;">
            <button class="modal-btn modal-close-btn-bottom" style="background:#6b7280; color:#fff; border:none; padding:6px 18px; border-radius:20px; cursor:pointer; font-size:0.9rem;">关闭</button>
            <button id="modalSaveBtn" style="display:none; background:#2d2a24; color:#f7f3eb; border:none; padding:6px 18px; border-radius:20px; cursor:pointer; font-size:0.9rem; margin-left:8px;">保存</button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const modal = document.getElementById('classmateModal');
    modal.addEventListener('click', function(e) {
      if (e.target === this || e.target.classList.contains('modal-close-btn') || e.target.classList.contains('modal-close-btn-bottom')) {
        this.style.display = 'none';
      }
    });
  }

  // 表格
  let html = `
    <div style="background:#fcf8f0; border-radius:12px; padding:20px; box-shadow:0 4px 16px rgba(0,0,0,0.06);">
      <h2 style="margin-bottom:16px; color:#2d2a24; font-size:1.2rem;">
        <i class="fas fa-address-book" style="color:#b8860b;"></i> 班级通讯录
      </h2>
      <div style="overflow-x:auto;">
        <table style="width:100%; border-collapse:collapse; font-size:0.9rem;">
          <thead>
            <tr style="background:#2d2a24; color:#f7f3eb;">
              <th style="padding:10px 12px; text-align:left; width:60px;">学号</th>
              <th style="padding:10px 12px; text-align:left;">姓名</th>
              <th style="padding:10px 12px; text-align:center; width:160px;">操作</th>
            </tr>
          </thead>
          <tbody>
  `;
  classmates.forEach(item => {
    html += `
      <tr style="border-bottom:1px solid #efe8dd;" data-id="${item.id}">
        <td style="padding:8px 12px; font-weight:600; color:#b8860b;">${item.id}</td>
        <td style="padding:8px 12px;"><span class="view-name">${escapeHtml(item.name || '未填写')}</span></td>
        <td style="padding:8px 12px; text-align:center;">
          <button class="detail-btn" data-id="${item.id}" style="background:none; border:none; color:#b8860b; cursor:pointer; font-size:0.85rem; padding:4px 8px;"><i class="fas fa-info-circle"></i> 详情</button>
          <button class="edit-btn" data-id="${item.id}" style="background:none; border:none; color:#3b82f6; cursor:pointer; font-size:0.85rem; padding:4px 8px;"><i class="fas fa-edit"></i> 编辑</button>
        </td>
      </tr>
    `;
  });
  html += `</tbody></table></div><div id="classStatus" style="margin-top:12px; text-align:center; font-size:0.9rem;"></div></div>`;
  container.innerHTML = html;

  // 事件：详情 & 编辑
  container.addEventListener('click', function(e) {
    const detailBtn = e.target.closest('.detail-btn');
    const editBtn = e.target.closest('.edit-btn');
    if (!detailBtn && !editBtn) return;
    const id = parseInt((detailBtn || editBtn).dataset.id, 10);
    const data = classmates.find(item => item.id === id);
    if (!data) return;

    const modal = document.getElementById('classmateModal');
    document.getElementById('modalId').textContent = data.id;
    const viewMode = document.getElementById('modalViewMode');
    const editMode = document.getElementById('modalEditMode');
    const saveBtn = document.getElementById('modalSaveBtn');
    const editName = document.getElementById('modalEditName');
    const editContact = document.getElementById('modalEditContact');

    if (detailBtn) {
      document.getElementById('modalName').textContent = data.name || '未填写';
      document.getElementById('modalContact').textContent = data.contact || '未填写';
      viewMode.style.display = 'block';
      editMode.style.display = 'none';
      saveBtn.style.display = 'none';
      document.querySelector('.modal-close-btn-bottom').textContent = '关闭';
    } else if (editBtn) {
      editName.value = data.name || '';
      editContact.value = data.contact || '';
      viewMode.style.display = 'none';
      editMode.style.display = 'block';
      saveBtn.style.display = 'inline-block';
      document.querySelector('.modal-close-btn-bottom').textContent = '取消';
      saveBtn._id = data.id;
      saveBtn._data = data;
    }
    modal.style.display = 'flex';
  });

  // 保存按钮
  document.getElementById('modalSaveBtn')?.addEventListener('click', async function() {
    const id = this._id;
    const name = document.getElementById('modalEditName').value.trim();
    const contact = document.getElementById('modalEditContact').value.trim();
    if (!name && !contact) {
      showClassStatus('请至少填写姓名或联系方式', 'error');
      return;
    }
    this.disabled = true;
    this.textContent = '保存中...';
    try {
      const res = await apiFetch(`/api/classmates/${id}`, { method: 'PUT', body: JSON.stringify({ name, contact }) });
      const result = await res.json();
      if (result.success) {
        showClassStatus(`学号 ${id} 保存成功！`, 'success');
        const idx = classmates.findIndex(item => item.id === id);
        if (idx !== -1) {
          classmates[idx].name = result.data.name || '';
          classmates[idx].contact = result.data.contact || '';
        }
        renderClassmates(classmates);
        document.getElementById('classmateModal').style.display = 'none';
      } else {
        showClassStatus(result.error || '保存失败', 'error');
      }
    } catch (err) {
      showClassStatus('网络错误，请重试', 'error');
    } finally {
      this.disabled = false;
      this.textContent = '保存';
    }
  });

  document.querySelector('.modal-close-btn-bottom')?.addEventListener('click', function() {
    document.getElementById('classmateModal').style.display = 'none';
  });
}

function showClassStatus(text, type) {
  const el = document.getElementById('classStatus');
  if (!el) return;
  el.textContent = text;
  el.style.color = type === 'success' ? '#2d7d46' : '#b34a4a';
  if (type === 'success') {
    setTimeout(() => { el.textContent = ''; }, 3000);
  }
}

// ============================================================
//  成长树
// ============================================================
const treeCanvas = document.getElementById('treeCanvas');
const fruitCountSpan = document.getElementById('fruitCount');

function initTreeCanvas() {
  const wrapper = treeCanvas.parentElement;
  const rect = wrapper.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  let size = Math.min(rect.width || 600, 600);
  if (size < 300) size = 300;
  treeCanvas.width = size * dpr;
  treeCanvas.height = size * dpr;
  treeCanvas.style.width = size + 'px';
  treeCanvas.style.height = size + 'px';
  const ctx = treeCanvas.getContext('2d');
  ctx.scale(dpr, dpr);
  return { ctx, size };
}

function drawTree(fruitCount) {
  const canvas = treeCanvas;
  const dpr = window.devicePixelRatio || 1;
  const size = canvas.width / dpr;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.scale(dpr, dpr);

  const centerX = size / 2;
  const groundY = size * 0.88;          // 地面略降
  const trunkWidth = size * 0.09;
  const trunkHeight = size * 0.22;

  // ---- 草地 ----
  const grassGrad = ctx.createLinearGradient(0, groundY, 0, size);
  grassGrad.addColorStop(0, '#7cb342');
  grassGrad.addColorStop(1, '#558b2f');
  ctx.fillStyle = grassGrad;
  ctx.fillRect(0, groundY, size, size - groundY);

  // ---- 树干 ----
  const trunkGrad = ctx.createLinearGradient(centerX - trunkWidth/2, 0, centerX + trunkWidth/2, 0);
  trunkGrad.addColorStop(0, '#5d4037');
  trunkGrad.addColorStop(0.5, '#795548');
  trunkGrad.addColorStop(1, '#4e342e');
  ctx.fillStyle = trunkGrad;
  ctx.shadowColor = 'rgba(0,0,0,0.2)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 4;
  ctx.beginPath();
  ctx.roundRect(centerX - trunkWidth/2, groundY - trunkHeight, trunkWidth, trunkHeight, 4);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#5d4037';
  ctx.beginPath();
  ctx.ellipse(centerX, groundY, trunkWidth * 0.8, trunkWidth * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();

  // ---- 树冠（上移，露出树干顶部） ----
  const crownY = groundY - trunkHeight - size * 0.18;  // 上移
  const crownRadius = size * 0.30;                     // 稍小一点

  ctx.shadowColor = 'rgba(0,0,0,0.15)';
  ctx.shadowBlur = 20;
  ctx.shadowOffsetY = 6;

  const crownGrad = ctx.createRadialGradient(
    centerX - crownRadius * 0.2, crownY - crownRadius * 0.3, crownRadius * 0.1,
    centerX, crownY, crownRadius
  );
  crownGrad.addColorStop(0, '#66bb6a');
  crownGrad.addColorStop(0.6, '#43a047');
  crownGrad.addColorStop(1, '#2e7d32');
  ctx.fillStyle = crownGrad;
  ctx.beginPath();
  ctx.arc(centerX, crownY, crownRadius, 0, Math.PI * 2);
  ctx.fill();

  // 辅助树冠（增加立体感）
  ctx.fillStyle = 'rgba(76, 175, 80, 0.5)';
  ctx.beginPath();
  ctx.arc(centerX - crownRadius * 0.4, crownY - crownRadius * 0.2, crownRadius * 0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(centerX + crownRadius * 0.4, crownY - crownRadius * 0.15, crownRadius * 0.55, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(centerX, crownY - crownRadius * 0.5, crownRadius * 0.65, 0, Math.PI * 2);
  ctx.fill();

  // 高光
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.beginPath();
  ctx.arc(centerX - crownRadius * 0.3, crownY - crownRadius * 0.4, crownRadius * 0.45, 0, Math.PI * 2);
  ctx.fill();

  // ---- 果实 ----
  const maxFruits = Math.min(fruitCount, 50);
  fruitCountSpan.textContent = maxFruits;
  if (maxFruits > 0) {
    const positions = [];
    const minDist = size * 0.045;
    let placed = 0;
    let tries = 0;
    while (placed < maxFruits && tries < 1000) {
      tries++;
      const angle = Math.random() * Math.PI * 2;
      const radius = crownRadius * (0.3 + Math.random() * 0.6);
      const x = centerX + Math.cos(angle) * radius;
      const y = crownY + Math.sin(angle) * radius * 0.85;
      if (Math.hypot(x - centerX, y - crownY) > crownRadius * 1.05) continue;
      let overlap = false;
      for (const p of positions) {
        if (Math.hypot(x - p.x, y - p.y) < minDist) { overlap = true; break; }
      }
      if (!overlap) {
        positions.push({ x, y });
        placed++;
      }
    }
    for (const p of positions) {
      const fruitSize = size * 0.035 + Math.random() * 0.01 * size;
      const hue = 20 + Math.random() * 30;
      const sat = 80 + Math.random() * 20;
      const lig = 55 + Math.random() * 25;
      ctx.shadowColor = 'rgba(0,0,0,0.2)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 2;

      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#5d4037';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y - fruitSize * 0.5);
      ctx.lineTo(p.x + (Math.random()-0.5)*4, p.y - fruitSize * 0.8);
      ctx.stroke();

      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 2;
      const grad = ctx.createRadialGradient(
        p.x - fruitSize * 0.3, p.y - fruitSize * 0.3, fruitSize * 0.1,
        p.x, p.y, fruitSize
      );
      grad.addColorStop(0, `hsl(${hue+10}, ${sat}%, ${lig+20}%)`);
      grad.addColorStop(0.7, `hsl(${hue}, ${sat}%, ${lig}%)`);
      grad.addColorStop(1, `hsl(${hue-10}, ${sat-10}%, ${lig-20}%)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, fruitSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.beginPath();
      ctx.arc(p.x - fruitSize * 0.25, p.y - fruitSize * 0.3, fruitSize * 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.beginPath();
      ctx.arc(p.x + fruitSize * 0.1, p.y - fruitSize * 0.4, fruitSize * 0.1, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ---- 树底阴影 ----
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  ctx.beginPath();
  ctx.ellipse(centerX, groundY + 2, trunkWidth * 1.5, trunkWidth * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();
}

async function loadTree() {
  const canvas = treeCanvas;
  if (!canvas) return;
  initTreeCanvas();
  try {
    const res = await apiFetch('/api/messages');
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    const count = data.data ? data.data.length : 0;
    drawTree(count);
  } catch (err) {
    console.error('加载留言数失败:', err);
    drawTree(0);
  }
}

// ============================================================
//  窗口自适应
// ============================================================
let resizeTimer;
window.addEventListener('resize', function() {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (document.querySelector('#tab-tree.active')) {
      loadTree();
    }
  }, 300);
});

// ============================================================
//  初始化
// ============================================================
loadMessages();
loadPhotos();