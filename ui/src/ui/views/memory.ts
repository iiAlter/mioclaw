import { LitElement, html, nothing } from "lit";
import { customElement, state } from "lit/decorators.js";
import type { AppViewState } from "../app-view-state.ts";

// Types
interface Memory {
  id: string;
  text: string;
  category: string;
  importance: number;
  timestamp?: string;
}

// Categories
const CATEGORIES = [
  { id: "preference", name: "偏好" },
  { id: "fact", name: "事实" },
  { id: "decision", name: "决策" },
  { id: "entity", name: "实体" },
  { id: "reflection", name: "反思" },
  { id: "other", name: "其他" },
  { id: "cases", name: "案例" },
];

const API_BASE = "/api/memory";

// Escape HTML
function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// MemoryBoard component
@customElement("memory-board")
export class MemoryBoard extends LitElement {
  @state() private memories: Memory[] = [];
  @state() private loading = false;
  @state() private searchQuery = "";
  @state() private modalOpen = false;
  @state() private deleteModalOpen = false;
  @state() private importModalOpen = false;
  @state() private editingMemory: Memory | null = null;
  @state() private deleteTargetId: string | null = null;
  @state() private importResult: { imported: number; skipped: number; errors: string[] } | null =
    null;

  // Form state
  @state() private formText = "";
  @state() private formCategory = "other";
  @state() private formImportance = 0.5;

  override createRenderRoot() {
    return this;
  }

  connectedCallback() {
    super.connectedCallback();
    void this.loadMemories();
  }

  // API calls
  private async loadMemories(query: string | null = null): Promise<void> {
    this.loading = true;
    try {
      const url = query
        ? `${API_BASE}/memories?q=${encodeURIComponent(query)}`
        : `${API_BASE}/memories`;
      const response = await fetch(url);
      const data: Memory[] = await response.json();
      // API returns array directly, not { memories: [] }
      this.memories = Array.isArray(data) ? data : data.memories || [];
    } catch (error) {
      console.error("Failed to load memories:", error);
    } finally {
      this.loading = false;
    }
  }

  private async saveMemory(): Promise<boolean> {
    const id = this.editingMemory?.id;
    const url = id ? `${API_BASE}/memories/${id}` : `${API_BASE}/memories`;
    const method = id ? "PUT" : "POST";
    const body = {
      text: this.formText,
      category: this.formCategory,
      importance: this.formImportance,
    };

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (response.ok) {
        this.closeModal();
        await this.loadMemories(this.searchQuery || null);
        return true;
      }
    } catch (error) {
      console.error("Failed to save memory:", error);
    }
    return false;
  }

  private async deleteMemory(): Promise<boolean> {
    if (!this.deleteTargetId) {
      return false;
    }
    try {
      const response = await fetch(`${API_BASE}/memories/${this.deleteTargetId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        this.closeDeleteModal();
        await this.loadMemories(this.searchQuery || null);
        return true;
      }
    } catch (error) {
      console.error("Failed to delete memory:", error);
    }
    return false;
  }

  private async exportMemories(): Promise<void> {
    try {
      const response = await fetch(`${API_BASE}/export`, { method: "POST" });
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
    }
  }

  private handleImportClick(): void {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.addEventListener("change", (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        void this.importMemories(file);
      }
    });
    input.click();
  }

  private async importMemories(file: File): Promise<void> {
    const reader = new FileReader();
    reader.addEventListener("load", async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        const response = await fetch(`${API_BASE}/import`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        const result = await response.json();
        this.importResult = {
          imported: result.imported ?? 0,
          skipped: result.skipped ?? 0,
          errors: result.errors ?? [],
        };
        this.importModalOpen = true;
        await this.loadMemories();
      } catch (error) {
        console.error("Import failed:", error);
        this.importResult = { imported: 0, skipped: 0, errors: [(error as Error).message] };
        this.importModalOpen = true;
      }
    });
    reader.readAsText(file);
  }

  // Modal handlers
  private openModal(memory: Memory | null = null): void {
    this.editingMemory = memory;
    this.formText = memory?.text ?? "";
    this.formCategory = memory?.category ?? "other";
    this.formImportance = memory?.importance ?? 0.5;
    this.modalOpen = true;
  }

  private closeModal(): void {
    this.modalOpen = false;
    this.editingMemory = null;
    this.formText = "";
    this.formCategory = "other";
    this.formImportance = 0.5;
  }

  private openDeleteModal(id: string): void {
    this.deleteTargetId = id;
    this.deleteModalOpen = true;
  }

  private closeDeleteModal(): void {
    this.deleteModalOpen = false;
    this.deleteTargetId = null;
  }

  private closeImportModal(): void {
    this.importModalOpen = false;
    this.importResult = null;
  }

  // Render helpers
  private renderCard(memory: Memory) {
    const importance = memory.importance ?? 0.5;
    const importanceClass = importance >= 0.7 ? "high" : importance >= 0.4 ? "medium" : "low";
    const date = memory.timestamp ? new Date(memory.timestamp).toLocaleDateString() : "";
    const truncatedText =
      memory.text.length > 100 ? memory.text.slice(0, 100) + "..." : memory.text;

    return html`
      <div class="memory-card" data-id=${memory.id}>
        <div class="card-text">${escapeHtml(truncatedText)}</div>
        <div class="card-meta">
          <div class="card-importance">
            <span class="importance-dot ${importanceClass}"></span>
            <span>${Math.round(importance * 100)}%</span>
          </div>
          <span>${date}</span>
          <div class="card-actions">
            <button class="card-btn edit" @click=${() => this.openModal(memory)}>编辑</button>
            <button class="card-btn delete" @click=${() => this.openDeleteModal(memory.id)}>删除</button>
          </div>
        </div>
      </div>
    `;
  }

  private renderColumn(category: { id: string; name: string }) {
    const cards = this.memories.filter((m) => m.category === category.id);
    return html`
      <div class="column" data-category=${category.id}>
        <div class="column-header">
          <span class="column-title">${category.name}</span>
          <span class="column-count">${cards.length}</span>
        </div>
        <div class="column-cards">
          ${
            cards.length === 0
              ? html`
                  <div class="empty-state">暂无记忆</div>
                `
              : cards.map((m) => this.renderCard(m))
          }
        </div>
      </div>
    `;
  }

  private renderModal() {
    if (!this.modalOpen) {
      return nothing;
    }
    return html`
      <div class="modal-overlay" @click=${(e: Event) => e.target === e.currentTarget && this.closeModal()}>
        <div class="modal-content">
          <h2>${this.editingMemory ? "编辑记忆" : "添加记忆"}</h2>
          <form @submit=${(e: Event) => {
            e.preventDefault();
            void this.saveMemory();
          }}>
            <div class="form-group">
              <label>内容</label>
              <textarea
                .value=${this.formText}
                @input=${(e: Event) => (this.formText = (e.target as HTMLTextAreaElement).value)}
                required
                placeholder="输入记忆内容..."
              ></textarea>
            </div>
            <div class="form-group">
              <label>分类</label>
              <select
                .value=${this.formCategory}
                @change=${(e: Event) => (this.formCategory = (e.target as HTMLSelectElement).value)}
              >
                ${CATEGORIES.map((c) => html`<option value=${c.id}>${c.name}</option>`)}
              </select>
            </div>
            <div class="form-group">
              <label>重要性: <span>${Math.round(this.formImportance * 100)}%</span></label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                .value=${String(this.formImportance)}
                @input=${(e: Event) => (this.formImportance = parseFloat((e.target as HTMLInputElement).value))}
              />
            </div>
            <div class="form-actions">
              <button type="button" class="btn-secondary" @click=${() => this.closeModal()}>取消</button>
              <button type="submit" class="btn-primary">保存</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  private renderDeleteModal() {
    if (!this.deleteModalOpen) {
      return nothing;
    }
    return html`
      <div class="modal-overlay" @click=${(e: Event) => e.target === e.currentTarget && this.closeDeleteModal()}>
        <div class="modal-content">
          <h2>确认删除</h2>
          <p>确定要删除这条记忆吗？此操作无法撤销。</p>
          <div class="form-actions">
            <button type="button" class="btn-secondary" @click=${() => this.closeDeleteModal()}>取消</button>
            <button type="button" class="btn-danger" @click=${() => this.deleteMemory()}>删除</button>
          </div>
        </div>
      </div>
    `;
  }

  private renderImportModal() {
    if (!this.importModalOpen || !this.importResult) {
      return nothing;
    }
    return html`
      <div class="modal-overlay" @click=${() => this.closeImportModal()}>
        <div class="modal-content">
          <h2>导入结果</h2>
          <p>成功导入: ${this.importResult.imported} 条</p>
          ${this.importResult.skipped > 0 ? html`<p>跳过: ${this.importResult.skipped} 条</p>` : nothing}
          ${
            this.importResult.errors.length > 0
              ? html`<p style="color: red">错误: ${this.importResult.errors.length} 条</p>`
              : nothing
          }
          <div class="form-actions">
            <button type="button" class="btn-primary" @click=${() => this.closeImportModal()}>关闭</button>
          </div>
        </div>
      </div>
    `;
  }

  override render() {
    return html`
      <style>
        :host {
          display: block;
          height: 100%;
        }
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        .header {
          background: var(--card);
          padding: 16px 24px;
          display: flex;
          align-items: center;
          gap: 16px;
          border-bottom: 1px solid var(--border);
        }
        .header h1 {
          font-size: 20px;
          font-weight: 600;
        }
        .search-bar {
          flex: 1;
          display: flex;
          gap: 8px;
          max-width: 400px;
        }
        .search-bar input {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid var(--border);
          border-radius: 6px;
          font-size: 14px;
          background: var(--input-bg);
          color: var(--text);
        }
        .btn-primary {
          padding: 8px 16px;
          background: #4f46e5;
          color: #fff;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
        }
        .btn-primary:hover {
          background: #4338ca;
        }
        .btn-secondary {
          padding: 8px 16px;
          background: var(--border);
          color: var(--text);
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
        }
        .btn-secondary:hover {
          background: var(--muted);
        }
        .btn-danger {
          padding: 8px 16px;
          background: #ef4444;
          color: #fff;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
        }
        .btn-danger:hover {
          background: #dc2626;
        }
        .board {
          display: flex;
          gap: 16px;
          padding: 24px;
          overflow-x: auto;
          height: calc(100vh - 200px);
        }
        .column {
          flex: 0 0 300px;
          background: var(--card);
          border-radius: 8px;
          border: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          max-height: 100%;
        }
        .column-header {
          padding: 16px;
          border-bottom: 1px solid var(--border);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .column-title {
          font-weight: 600;
          font-size: 14px;
          text-transform: uppercase;
        }
        .column[data-category="preference"] .column-title { color: #8b5cf6; }
        .column[data-category="fact"] .column-title { color: #3b82f6; }
        .column[data-category="decision"] .column-title { color: #f59e0b; }
        .column[data-category="entity"] .column-title { color: #10b981; }
        .column[data-category="reflection"] .column-title { color: #ec4899; }
        .column[data-category="other"] .column-title { color: #6b7280; }
        .column-count {
          background: var(--border);
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 12px;
          color: var(--muted);
        }
        .column-cards {
          flex: 1;
          overflow-y: auto;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .memory-card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 12px;
          transition: box-shadow 0.2s, transform 0.2s;
        }
        .memory-card:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          transform: translateY(-1px);
        }
        .card-text {
          font-size: 14px;
          line-height: 1.5;
          margin-bottom: 8px;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
          word-break: break-word;
        }
        .card-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
          color: var(--muted);
        }
        .card-importance {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .importance-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #ddd;
        }
        .importance-dot.high { background: #ef4444; }
        .importance-dot.medium { background: #f59e0b; }
        .importance-dot.low { background: #10b981; }
        .card-actions {
          display: flex;
          gap: 4px;
          opacity: 0;
          transition: opacity 0.2s;
        }
        .memory-card:hover .card-actions {
          opacity: 1;
        }
        .card-btn {
          padding: 4px 8px;
          background: var(--border);
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }
        .card-btn:hover {
          background: var(--muted);
        }
        .card-btn.delete:hover {
          background: #fee2e2;
          color: #ef4444;
        }
        .empty-state {
          text-align: center;
          padding: 24px;
          color: var(--muted);
          font-size: 14px;
        }
        .loading {
          text-align: center;
          padding: 48px;
          color: var(--muted);
        }
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .modal-content {
          background: var(--card);
          border-radius: 12px;
          padding: 24px;
          width: 100%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
        }
        .modal-content h2 {
          margin-bottom: 16px;
          font-size: 20px;
        }
        .form-group {
          margin-bottom: 16px;
        }
        .form-group label {
          display: block;
          margin-bottom: 4px;
          font-size: 14px;
          font-weight: 500;
        }
        .form-group input,
        .form-group textarea,
        .form-group select {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid var(--border);
          border-radius: 6px;
          font-size: 14px;
          background: var(--input-bg);
          color: var(--text);
        }
        .form-group textarea {
          min-height: 120px;
          resize: vertical;
        }
        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          margin-top: 24px;
        }
        @media (max-width: 768px) {
          .board {
            flex-direction: column;
            height: auto;
          }
          .column {
            flex: none;
            width: 100%;
            max-height: none;
          }
          .header {
            flex-wrap: wrap;
          }
          .search-bar {
            order: 3;
            max-width: none;
            width: 100%;
          }
        }
      </style>

      <div class="header">
        <h1>Memory Board</h1>
        <div class="search-bar">
          <input
            type="text"
            placeholder="搜索记忆..."
            .value=${this.searchQuery}
            @input=${(e: Event) => (this.searchQuery = (e.target as HTMLInputElement).value)}
            @keypress=${(e: KeyboardEvent) => e.key === "Enter" && this.loadMemories(this.searchQuery || null)}
          />
          <button class="btn-secondary" @click=${() => this.loadMemories(this.searchQuery || null)}>搜索</button>
        </div>
        <button class="btn-secondary" @click=${() => this.exportMemories()}>导出</button>
        <button class="btn-secondary" @click=${() => this.handleImportClick()}>导入</button>
        <button class="btn-primary" @click=${() => this.openModal()}>+ 添加记忆</button>
      </div>

      ${
        this.loading
          ? html`
              <div class="loading">加载中...</div>
            `
          : html`<div class="board">${CATEGORIES.map((c) => this.renderColumn(c))}</div>`
      }

      ${this.renderModal()}
      ${this.renderDeleteModal()}
      ${this.renderImportModal()}
    `;
  }
}

// Render function for the memory tab
export function renderMemory(_state: AppViewState) {
  return html`
    <memory-board></memory-board>
  `;
}
