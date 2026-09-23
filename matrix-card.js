/**
 * Matrix Card
 * A Home Assistant Lovelace card that visualises one or more `select`
 * entities as a clickable routing matrix (rows = available options,
 * columns = configured entities). Entities that share the exact same
 * option list are automatically grouped into a single grid; an entity
 * with a unique option list simply renders as its own single-column
 * strip using the same code path — 1 entity is a valid, minimal config.
 *
 * No build step required — this file is loaded as-is by the browser.
 *
 * v0.2.0 — bugfixes and compacting, see CHANGELOG.md.
 */

const CARD_TAG = "matrix-card";
const CARD_VERSION = "0.2.0";

/** How long an optimistic "pending" cell is shown before we give up
 * waiting for hass to confirm the new state and flag it as an error. */
const PENDING_TIMEOUT_MS = 8000;

/** Row labels longer than this get a diagonal tilt instead of wrapping,
 * so a compact row height still stays readable. */
const ROW_LABEL_TILT_THRESHOLD = 10;

class MatrixCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._pending = new Map(); // entity_id -> { option, timer }
    this._errors = new Map(); // entity_id -> message
    this._config = null;
    this._hass = null;
  }

  /**
   * Called by Lovelace whenever the card configuration changes.
   * Must throw on invalid config so HA can render its built-in error card.
   */
  setConfig(config) {
    if (!config || typeof config !== "object") {
      throw new Error(`${CARD_TAG}: configuratie ontbreekt.`);
    }
    if (!Array.isArray(config.columns) || config.columns.length === 0) {
      throw new Error(
        `${CARD_TAG}: "columns" is verplicht en moet minstens 1 entity bevatten.`
      );
    }
    config.columns.forEach((col, i) => {
      if (!col || typeof col.entity !== "string" || !col.entity.includes(".")) {
        throw new Error(
          `${CARD_TAG}: kolom ${i + 1} heeft een geldige "entity" nodig.`
        );
      }
    });
    this._config = config;
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  get hass() {
    return this._hass;
  }

  /** Rough size hint for the masonry view. */
  getCardSize() {
    if (!this._config) return 3;
    const { groups } = this._computeGroups();
    const maxRows = groups.reduce((m, g) => Math.max(m, g.options.length), 1);
    return 1 + Math.ceil(maxRows / 3);
  }

  static getStubConfig() {
    return {
      type: `custom:${CARD_TAG}`,
      title: "Matrix",
      columns: [{ entity: "select.example_output_1" }, { entity: "select.example_output_2" }],
    };
  }

  static getConfigElement() {
    // Visual editor is not part of this release; users configure via YAML.
    // Returning nothing keeps the card usable without one.
    return undefined;
  }

  // ---------------------------------------------------------------------
  // Grouping
  // ---------------------------------------------------------------------

  /**
   * Groups configured columns by their exact option list (order-sensitive).
   * Columns whose entity is missing, unavailable, or not a `select` get
   * flagged in this._errors and are rendered separately as error rows.
   * Returns an array of { key, options, columns } plus a list of broken
   * column configs.
   */
  _computeGroups() {
    const groups = [];
    const byKey = new Map();
    const broken = [];

    for (const col of this._config.columns) {
      const state = this._hass && this._hass.states[col.entity];
      if (!state) {
        broken.push({ col, message: "Entity niet gevonden" });
        continue;
      }
      const domain = col.entity.split(".")[0];
      if (domain !== "select") {
        broken.push({
          col,
          message: `Domein "${domain}" wordt nog niet ondersteund (alleen select.*)`,
        });
        continue;
      }
      const options = Array.isArray(state.attributes.options)
        ? state.attributes.options
        : [];
      const key = JSON.stringify(options);
      let group = byKey.get(key);
      if (!group) {
        group = { key, options, columns: [] };
        byKey.set(key, group);
        groups.push(group);
      }
      group.columns.push(col);
    }

    return { groups, broken };
  }

  // ---------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------

  async _selectOption(entityId, option) {
    if (!this._hass) return;

    const existing = this._pending.get(entityId);
    if (existing) clearTimeout(existing.timer);

    const timer = setTimeout(() => {
      this._pending.delete(entityId);
      this._errors.set(
        entityId,
        `Geen bevestiging ontvangen voor "${option}" binnen ${PENDING_TIMEOUT_MS / 1000}s`
      );
      this._render();
    }, PENDING_TIMEOUT_MS);

    this._pending.set(entityId, { option, timer });
    this._errors.delete(entityId);
    this._render();

    try {
      await this._hass.callService("select", "select_option", {
        entity_id: entityId,
        option,
      });
      // Success: leave the pending marker in place until the real state
      // update arrives via `set hass()`, which clears it naturally once
      // state.state === option (see _render / _clearPendingIfConfirmed).
    } catch (err) {
      clearTimeout(timer);
      this._pending.delete(entityId);
      this._errors.set(entityId, `Kon niet schakelen naar "${option}": ${err.message || err}`);
      // eslint-disable-next-line no-console
      console.error(`${CARD_TAG}: select_option failed`, entityId, option, err);
      this._render();
    }
  }

  _clearPendingIfConfirmed() {
    for (const [entityId, pending] of this._pending.entries()) {
      const state = this._hass && this._hass.states[entityId];
      if (state && state.state === pending.option) {
        clearTimeout(pending.timer);
        this._pending.delete(entityId);
        this._errors.delete(entityId);
      }
    }
  }

  // ---------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------

  _render() {
    if (!this._config || !this.shadowRoot) return;

    if (!this._hass) {
      this.shadowRoot.innerHTML = "";
      return;
    }

    this._clearPendingIfConfirmed();

    const { groups, broken } = this._computeGroups();

    const card = document.createElement("ha-card");
    if (this._config.title) card.header = this._config.title;

    const style = document.createElement("style");
    style.textContent = this._css();
    card.appendChild(style);

    const body = document.createElement("div");
    body.className = "matrix-card-body";

    if (groups.length === 0 && broken.length === 0) {
      body.appendChild(this._emptyState());
    }

    for (const group of groups) {
      body.appendChild(this._renderGroup(group));
    }

    for (const item of broken) {
      body.appendChild(this._renderBroken(item));
    }

    card.appendChild(body);

    this.shadowRoot.innerHTML = "";
    this.shadowRoot.appendChild(card);
  }

  _emptyState() {
    const div = document.createElement("div");
    div.className = "empty";
    div.textContent = "Geen bruikbare entities geconfigureerd.";
    return div;
  }

  _renderBroken({ col, message }) {
    const div = document.createElement("div");
    div.className = "group broken";
    const name = col.name || col.entity;
    div.innerHTML = `<div class="group-title">${this._esc(name)}</div>
      <div class="broken-message">${this._esc(message)}</div>`;
    return div;
  }

  _renderGroup(group) {
    const wrapper = document.createElement("div");
    wrapper.className = "group";

    const grid = document.createElement("div");
    grid.className = "grid";
    grid.style.gridTemplateColumns = `minmax(80px, auto) repeat(${group.columns.length}, minmax(56px, 1fr))`;

    // Header row: empty corner + one header per column
    grid.appendChild(this._cellDiv("", "corner"));
    for (const col of group.columns) {
      const state = this._hass.states[col.entity];
      const name = col.name || (state && state.attributes.friendly_name) || col.entity;
      grid.appendChild(this._cellDiv(name, "header-cell"));
    }

    // One row per option
    for (const option of group.options) {
      grid.appendChild(this._rowLabelDiv(option));
      for (const col of group.columns) {
        grid.appendChild(this._renderCell(col, option));
      }
    }

    wrapper.appendChild(grid);
    return wrapper;
  }

  _renderCell(col, option) {
    const state = this._hass.states[col.entity];
    const pending = this._pending.get(col.entity);
    const error = this._errors.get(col.entity);
    const currentValue = pending ? pending.option : state.state;
    const isSelected = currentValue === option;

    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "cell";
    if (isSelected) cell.classList.add("selected");
    if (pending && pending.option === option) cell.classList.add("pending");
    if (error && isSelected) cell.classList.add("error");
    cell.setAttribute(
      "aria-label",
      `${col.name || col.entity}: ${option}${isSelected ? " (huidig)" : ""}`
    );
    if (error && isSelected) cell.title = error;

    const dot = document.createElement("span");
    dot.className = "dot";
    cell.appendChild(dot);

    cell.addEventListener("click", () => this._selectOption(col.entity, option));

    return cell;
  }

  _cellDiv(text, className) {
    const div = document.createElement("div");
    div.className = className;
    div.textContent = text;
    return div;
  }

  /** Row label (an option, on the vertical axis). Tilts 30° for longer
   * text so a compact row height stays readable — straight otherwise. */
  _rowLabelDiv(text) {
    const div = this._cellDiv(text, "row-label");
    if (String(text).length > ROW_LABEL_TILT_THRESHOLD) {
      div.classList.add("tilt");
    }
    return div;
  }

  _esc(str) {
    const div = document.createElement("div");
    div.textContent = String(str);
    return div.innerHTML;
  }

  _css() {
    return `
      :host { display: block; }
      ha-card { padding: 12px; }
      .matrix-card-body { display: flex; flex-direction: column; gap: 14px; }
      .empty { color: var(--secondary-text-color); font-size: 0.9em; }
      .group { overflow-x: auto; }
      .group-title { font-weight: 500; margin-bottom: 6px; }
      .broken { border: 1px dashed var(--error-color, #db4437); border-radius: 8px; padding: 6px 10px; }
      .broken-message { color: var(--error-color, #db4437); font-size: 0.85em; }
      .grid { display: grid; gap: 2px; align-items: stretch; }
      .corner { }
      .header-cell, .row-label {
        font-size: 0.72em;
        line-height: 1.15;
        color: var(--secondary-text-color);
        display: flex;
        align-items: center;
        padding: 2px;
      }
      /* Horizontal axis: entity names. Always upright, never rotated —
         rotating this is what made the axes look swapped in v0.1.0. */
      .header-cell { justify-content: center; text-align: center; word-break: break-word; }
      /* Vertical axis: the options. Right-aligned and compact by default;
         .tilt (long labels only) swings 30° so it still fits a short row. */
      .row-label { justify-content: flex-end; text-align: right; padding-right: 6px; }
      .row-label.tilt {
        justify-content: flex-end;
        white-space: nowrap;
        transform: rotate(-30deg);
        transform-origin: right center;
        padding-block: 6px;
      }
      .cell {
        appearance: none;
        border: 1px solid var(--divider-color);
        background: var(--card-background-color);
        border-radius: 4px;
        min-height: 26px;
        min-width: 26px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        padding: 0;
      }
      .cell:hover { border-color: var(--primary-color); }
      .cell:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 1px; }
      .cell .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: transparent;
      }
      .cell.selected .dot { background: var(--primary-color); }
      .cell.pending { opacity: 0.55; }
      .cell.pending .dot { background: var(--secondary-text-color); }
      .cell.error { border-color: var(--error-color, #db4437); }
      .cell.error .dot { background: var(--error-color, #db4437); }
    `;
  }
}

if (!customElements.get(CARD_TAG)) {
  customElements.define(CARD_TAG, MatrixCard);
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: CARD_TAG,
  name: "Matrix Card",
  description: "Toont en bedient één of meer select-entities als een klikbare routing-matrix.",
});

// eslint-disable-next-line no-console
console.info(`[${CARD_TAG}] v${CARD_VERSION} geladen`);
