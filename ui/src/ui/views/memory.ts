import { html } from "lit";
import type { AppViewState } from "../app-view-state.ts";

export function renderMemory(_state: AppViewState) {
  window.location.href = "/memory";
  return html`
    <div>Redirecting to Memory Board...</div>
  `;
}
