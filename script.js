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
//  Tab 切换
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

  // ===== 模态框 =====
  if (!document.getElementById('classmateModal')) {
    const modalHTML = `
      <div id="classmateModal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); z-index:1000; justify-content:center; align-items:center;">
        <div style="background:#fcf8f0; border-radius:16px; padding:24px; max-width:340px; width:90%; box-shadow:0 8px 24px rgba(0,0,0,0.3); position:relative;">
          <button onclick="document.getElementById('classmateModal').style.display='none'" style="position:absolute; top:8px; right:12px; background:none; border:none; font-size:1.4rem; cursor:pointer; color:#2d2a24;">&times;</button>
          <h3 style="margin-bottom:12px; color:#2d2a24;">学号 <span id="modalId"></span></h3>
          <p style="margin-bottom:6px;"><strong>姓名：</strong><span id="modalName"></span></p>
          <p><strong>联系方式：</strong><span id="modalContact"></span></p>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.getElementById('classmateModal').addEventListener('click', function(e) {
      if (e.target === this) this.style.display = 'none';
    });
  }

  // ===== 渲染表格 =====
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
              <th style="padding:10px 12px; text-align:center; width:120px;">操作</th>
            </tr>
          </thead>
          <tbody>
  `;

  classmates.forEach(item => {
    const displayName = item.name || '未填写';
    html += `
      <tr style="border-bottom:1px solid #efe8dd;" data-id="${item.id}">
        <td style="padding:8px 12px; font-weight:600; color:#b8860b;">${item.id}</td>
        <td style="padding:8px 12px;">
          <span class="view-name">${escapeHtml(displayName)}</span>
          <div class="edit-fields" style="display:none;">
            <input type="text" class="class-name-input" value="${escapeHtml(item.name || '')}" placeholder="姓名" maxlength="20" style="width:100%; padding:6px 10px; border:1px solid #ddd2c2; border-radius:6px; background:#fff; color:#2d2a24; font-size:0.9rem;">
          </div>
        </td>
        <td style="padding:8px 12px; text-align:center;">
          <div class="view-actions">
            <button class="detail-btn" data-id="${item.id}" style="background:none; border:none; color:#b8860b; cursor:pointer; font-size:0.85rem; padding:4px 8px;">
              <i class="fas fa-info-circle"></i> 详情
            </button>
            <button class="edit-btn" data-id="${item.id}" style="background:none; border:none; color:#3b82f6; cursor:pointer; font-size:0.85rem; padding:4px 8px;">
              <i class="fas fa-edit"></i> 编辑
            </button>
          </div>
          <div class="edit-actions" style="display:none;">
            <div style="margin-bottom:4px;">
              <input type="text" class="class-contact-input" value="${escapeHtml(item.contact || '')}" placeholder="联系方式" maxlength="50" style="width:100%; padding:6px 10px; border:1px solid #ddd2c2; border-radius:6px; background:#fff; color:#2d2a24; font-size:0.9rem;">
            </div>
            <button class="save-btn" data-id="${item.id}" style="background:#2d2a24; color:#f7f3eb; border:none; padding:4px 14px; border-radius:20px; cursor:pointer; font-size:0.8rem;">保存</button>
            <button class="cancel-btn" data-id="${item.id}" style="background:none; border:none; color:#6b7280; cursor:pointer; font-size:0.8rem; padding:4px 8px;">取消</button>
          </div>
        </td>
      </tr>
    `;
  });

  html += `
          </tbody>
        </table>
      </div>
      <div id="classStatus" style="margin-top:12px; text-align:center; font-size:0.9rem;"></div>
    </div>
  `;

  container.innerHTML = html;

  // ===== 事件委托：详情按钮 =====
  container.addEventListener('click', function(e) {
    const btn = e.target.closest('.detail-btn');
    if (btn) {
      const id = parseInt(btn.dataset.id, 10);
      const data = classmates.find(item => item.id === id);
      if (data) {
        document.getElementById('modalId').textContent = data.id;
        document.getElementById('modalName').textContent = data.name || '未填写';
        document.getElementById('modalContact').textContent = data.contact || '未填写';
        document.getElementById('classmateModal').style.display = 'flex';
      }
    }
  });

  // ===== 事件委托：编辑按钮 =====
  container.addEventListener('click', function(e) {
    const btn = e.target.closest('.edit-btn');
    if (btn) {
      const row = btn.closest('tr');
      row.querySelector('.view-name').style.display = 'none';
      row.querySelector('.view-actions').style.display = 'none';
      row.querySelector('.edit-fields').style.display = 'block';
      row.querySelector('.edit-actions').style.display = 'block';
    }
  });

  // ===== 事件委托：取消按钮 =====
  container.addEventListener('click', function(e) {
    const btn = e.target.closest('.cancel-btn');
    if (btn) {
      const row = btn.closest('tr');
      const id = parseInt(btn.dataset.id, 10);
      const data = classmates.find(item => item.id === id);
      if (data) {
        row.querySelector('.view-name').textContent = data.name || '未填写';
        row.querySelector('.class-name-input').value = data.name || '';
        row.querySelector('.class-contact-input').value = data.contact || '';
      }
      row.querySelector('.view-name').style.display = 'inline';
      row.querySelector('.view-actions').style.display = 'inline-block';
      row.querySelector('.edit-fields').style.display = 'none';
      row.querySelector('.edit-actions').style.display = 'none';
    }
  });

  // ===== 事件委托：保存按钮 =====
  container.addEventListener('click', async function(e) {
    const btn = e.target.closest('.save-btn');
    if (!btn) return;

    const id = parseInt(btn.dataset.id, 10);
    const row = btn.closest('tr');
    const nameInput = row.querySelector('.class-name-input');
    const contactInput = row.querySelector('.class-contact-input');
    const name = nameInput.value.trim();
    const contact = contactInput.value.trim();

    if (!name && !contact) {
      showClassStatus('请至少填写姓名或联系方式', 'error');
      return;
    }

    btn.disabled = true;
    btn.textContent = '保存中...';
    try {
      const res = await apiFetch(`/api/classmates/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ name, contact })
      });
      const data = await res.json();
      if (data.success) {
        showClassStatus(`学号 ${id} 保存成功！`, 'success');
        const idx = classmates.findIndex(item => item.id === id);
        if (idx !== -1) {
          classmates[idx].name = data.data.name || '';
          classmates[idx].contact = data.data.contact || '';
        }
        // 更新视图
        row.querySelector('.view-name').textContent = data.data.name || '未填写';
        row.querySelector('.class-name-input').value = data.data.name || '';
        row.querySelector('.class-contact-input').value = data.data.contact || '';
        row.querySelector('.view-name').style.display = 'inline';
        row.querySelector('.view-actions').style.display = 'inline-block';
        row.querySelector('.edit-fields').style.display = 'none';
        row.querySelector('.edit-actions').style.display = 'none';
      } else {
        showClassStatus(data.error || '保存失败', 'error');
      }
    } catch (err) {
      showClassStatus('网络错误，请重试', 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = '保存';
    }
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
//  初始化
// ============================================================
loadMessages();
loadPhotos();