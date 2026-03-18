// Memory Board Frontend Application

const API_BASE = "/api/memory";
const CATEGORIES = [
  { id: "preference", name: "偏好" },
  { id: "fact", name: "事实" },
  { id: "decision", name: "决策" },
  { id: "entity", name: "实体" },
  { id: "reflection", name: "反思" },
  { id: "other", name: "其他" },
];

// 状态
let memories = [];
let deleteId = null;

// DOM 元素
const board = document.getElementById("board");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const addBtn = document.getElementById("addBtn");
const memoryModal = document.getElementById("memoryModal");
const deleteModal = document.getElementById("deleteModal");
const memoryForm = document.getElementById("memoryForm");
const memoryIdInput = document.getElementById("memoryId");
const memoryTextInput = document.getElementById("memoryText");
const memoryCategorySelect = document.getElementById("memoryCategory");
const memoryImportanceInput = document.getElementById("memoryImportance");
const importanceValue = document.getElementById("importanceValue");
const cancelBtn = document.getElementById("cancelBtn");
const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
const exportBtn = document.getElementById("exportBtn");
const importBtn = document.getElementById("importBtn");
const importFile = document.getElementById("importFile");
const importModal = document.getElementById("importModal");
const importResult = document.getElementById("importResult");
const closeImportBtn = document.getElementById("closeImportBtn");

// 初始化
async function init() {
  renderBoard();
  await loadMemories();

  // 事件监听
  searchBtn.addEventListener("click", handleSearch);
  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  });
  addBtn.addEventListener("click", () => openModal());
  cancelBtn.addEventListener("click", closeModal);
  cancelDeleteBtn.addEventListener("click", closeDeleteModal);
  confirmDeleteBtn.addEventListener("click", handleDelete);
  memoryForm.addEventListener("submit", handleSubmit);
  memoryImportanceInput.addEventListener("input", (e) => {
    importanceValue.textContent = e.target.value;
  });

  // 点击模态框外部关闭
  memoryModal.addEventListener("click", (e) => {
    if (e.target === memoryModal) {
      closeModal();
    }
  });
  deleteModal.addEventListener("click", (e) => {
    if (e.target === deleteModal) {
      closeDeleteModal();
    }
  });
  importModal.addEventListener("click", (e) => {
    if (e.target === importModal) {
      closeImportModal();
    }
  });

  // 导出导入事件
  exportBtn.addEventListener("click", handleExport);
  importBtn.addEventListener("click", () => importFile.click());
  importFile.addEventListener("change", handleImportFile);
  closeImportBtn.addEventListener("click", closeImportModal);
}

// 渲染看板骨架
function renderBoard() {
  board.innerHTML = CATEGORIES.map(
    (cat) => `
    <div class="column" data-category="${cat.id}">
      <div class="column-header">
        <span class="column-title">${cat.name}</span>
        <span class="column-count" data-count="${cat.id}">0</span>
      </div>
      <div class="column-cards" data-category="${cat.id}"></div>
    </div>
  `,
  ).join("");
}

// 加载记忆
async function loadMemories(query = null) {
  try {
    const url = query
      ? `${API_BASE}/memories?q=${encodeURIComponent(query)}`
      : `${API_BASE}/memories`;
    const response = await fetch(url);
    const data = await response.json();
    memories = data.memories || [];
    renderMemories();
  } catch (error) {
    console.error("Failed to load memories:", error);
  }
}

// 渲染记忆卡片
function renderMemories() {
  // 清空所有列
  document.querySelectorAll(".column-cards").forEach((col) => {
    col.innerHTML = "";
  });

  // 按分类分组
  const grouped = {};
  CATEGORIES.forEach((cat) => {
    grouped[cat.id] = memories.filter((m) => m.category === cat.id);
  });

  // 更新计数并渲染卡片
  CATEGORIES.forEach((cat) => {
    const countEl = document.querySelector(`[data-count="${cat.id}"]`);
    const cardsEl = document.querySelector(`.column-cards[data-category="${cat.id}"]`);

    if (countEl) {
      countEl.textContent = grouped[cat.id].length;
    }

    if (cardsEl) {
      if (grouped[cat.id].length === 0) {
        cardsEl.innerHTML = '<div class="empty-state">暂无记忆</div>';
      } else {
        cardsEl.innerHTML = grouped[cat.id].map((m) => renderCard(m)).join("");
      }
    }
  });

  // 绑定卡片事件
  document.querySelectorAll(".card-btn.edit").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const memory = memories.find((m) => m.id === id);
      if (memory) {
        openModal(memory);
      }
    });
  });

  document.querySelectorAll(".card-btn.delete").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      deleteId = btn.dataset.id;
      openDeleteModal();
    });
  });
}

// 渲染单个卡片
function renderCard(memory) {
  const importance = memory.importance || 0.5;
  const importanceClass = importance >= 0.7 ? "high" : importance >= 0.4 ? "medium" : "low";
  const date = memory.timestamp ? new Date(memory.timestamp).toLocaleDateString() : "";

  return `
    <div class="memory-card" data-id="${memory.id}">
      <div class="card-text">${escapeHtml(memory.text)}</div>
      <div class="card-meta">
        <div class="card-importance">
          <span class="importance-dot ${importanceClass}"></span>
          <span>${Math.round(importance * 100)}%</span>
        </div>
        <span>${date}</span>
        <div class="card-actions">
          <button class="card-btn edit" data-id="${memory.id}">编辑</button>
          <button class="card-btn delete" data-id="${memory.id}">删除</button>
        </div>
      </div>
    </div>
  `;
}

// 搜索
function handleSearch() {
  const query = searchInput.value.trim();
  void loadMemories(query || null);
}

// 打开模态框
function openModal(memory = null) {
  memoryIdInput.value = memory?.id || "";
  memoryTextInput.value = memory?.text || "";
  memoryCategorySelect.value = memory?.category || "other";
  memoryImportanceInput.value = memory?.importance || 0.5;
  importanceValue.textContent = memoryImportanceInput.value;
  document.getElementById("modalTitle").textContent = memory ? "编辑记忆" : "添加记忆";
  memoryModal.classList.add("active");
  memoryTextInput.focus();
}

// 关闭模态框
function closeModal() {
  memoryModal.classList.remove("active");
  memoryForm.reset();
}

// 提交表单
async function handleSubmit(e) {
  e.preventDefault();

  const id = memoryIdInput.value;
  const data = {
    text: memoryTextInput.value,
    category: memoryCategorySelect.value,
    importance: parseFloat(memoryImportanceInput.value),
  };

  try {
    const url = id ? `${API_BASE}/memories/${id}` : `${API_BASE}/memories`;
    const method = id ? "PUT" : "POST";

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      closeModal();
      await loadMemories();
    } else {
      alert("保存失败");
    }
  } catch (error) {
    console.error("Failed to save:", error);
    alert("保存失败");
  }
}

// 打开删除确认
function openDeleteModal() {
  deleteModal.classList.add("active");
}

// 关闭删除确认
function closeDeleteModal() {
  deleteModal.classList.remove("active");
  deleteId = null;
}

// 删除记忆
async function handleDelete() {
  if (!deleteId) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/memories/${deleteId}`, {
      method: "DELETE",
    });

    if (response.ok) {
      closeDeleteModal();
      await loadMemories();
    } else {
      alert("删除失败");
    }
  } catch (error) {
    console.error("Failed to delete:", error);
    alert("删除失败");
  }
}

// HTML 转义
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// 导出记忆
async function handleExport() {
  try {
    const response = await fetch(`${API_BASE}/export`, {
      method: "POST",
    });

    if (!response.ok) {
      throw new Error("Export failed");
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `memory-backup-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Export failed:", error);
    alert("导出失败");
  }
}

// 选择导入文件
function handleImportFile(e) {
  const file = e.target.files[0];
  if (!file) {
    return;
  }

  const reader = new FileReader();
  reader.addEventListener("load", async (event) => {
    try {
      const data = JSON.parse(event.target.result);

      const response = await fetch(`${API_BASE}/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        let html = `<p>导入成功!</p>`;
        html += `<p>成功导入: ${result.imported} 条</p>`;
        if (result.skipped > 0) {
          html += `<p>跳过: ${result.skipped} 条</p>`;
        }
        if (result.errors && result.errors.length > 0) {
          html += `<p>错误: ${result.errors.length} 条</p>`;
        }
        importResult.innerHTML = html;
      } else {
        importResult.innerHTML = `<p style="color: red">导入失败: ${result.error}</p>`;
      }

      importModal.classList.add("active");
      await loadMemories();
    } catch (error) {
      console.error("Import failed:", error);
      alert("导入失败: " + error.message);
    }

    // 重置文件输入
    importFile.value = "";
  });
  reader.readAsText(file);
}

// 关闭导入结果模态框
function closeImportModal() {
  importModal.classList.remove("active");
}

// 启动
void init();
