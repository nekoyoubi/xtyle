"use strict";
(() => {
  // packages/xtyle/src/elements/fragments/dock-zone/mod.ts
  var CLOSE_GLYPH = "\u2715";
  var DOCK_GLYPH = "\u2913";
  var KEBAB_GLYPH = "\u22EE";
  function esc(value) {
    return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function escAttr(value) {
    return esc(value).replace(/"/g, "&quot;");
  }
  function badge(panel) {
    if (!panel.badge) return "";
    return `<span class="xtyle-dock-zone__badge" part="badge" aria-hidden="true">${esc(panel.badge)}</span>`;
  }
  function controls(panel) {
    if (!panel.closable && !panel.hasMenu && (panel.actions ?? []).length === 0) return "";
    const owner = escAttr(panel.id);
    let html = `<div class="xtyle-dock-zone__actions" part="actions">`;
    for (const action of panel.actions ?? []) {
      const label = escAttr(action.label);
      html += `<button type="button" class="xtyle-dock-zone__action" part="action" data-panel-action data-owner-panel="${owner}" data-action-id="${escAttr(action.id)}" aria-label="${label}" title="${label}">${esc(action.icon ?? action.label)}</button>`;
    }
    if (panel.hasMenu) {
      const label = escAttr(`${panel.title} options`);
      html += `<button type="button" class="xtyle-dock-zone__action xtyle-dock-zone__kebab" part="kebab" data-panel-menu data-owner-panel="${owner}" aria-haspopup="menu" aria-label="${label}" title="${label}"><span class="xtyle-dock-zone__kebab-glyph" part="kebab-glyph" aria-hidden="true">${KEBAB_GLYPH}</span></button>`;
    }
    if (panel.closable) {
      const label = escAttr(`Close ${panel.title}`);
      html += `<button type="button" class="xtyle-dock-zone__action xtyle-dock-zone__close" part="close" data-panel-close data-owner-panel="${owner}" aria-label="${label}" title="${label}">${CLOSE_GLYPH}</button>`;
    }
    return `${html}</div>`;
  }
  function tab(panel, zoneId, active) {
    const isActive = active ? " is-active" : "";
    return `<button type="button" class="xtyle-dock-zone__tab${isActive}" part="tab" role="tab" aria-selected="${active}" data-tab data-panel-id="${escAttr(panel.id)}" data-zone-id="${escAttr(zoneId)}" data-index="${panel.index}">${esc(panel.title)}${badge(panel)}</button>`;
  }
  function tabsLeaf(node2) {
    const zoneId = node2.id ?? "";
    const panels = node2.panels ?? [];
    const active = node2.active ?? 0;
    const strip = panels.map((panel, i) => tab(panel, zoneId, i === active)).join("");
    const activePanel = panels[active];
    return `<div class="xtyle-dock-zone__leaf" part="zone" data-zone-id="${escAttr(zoneId)}" style="flex:${node2.flex ?? 1}"><div class="xtyle-dock-zone__head" part="head"><div class="xtyle-dock-zone__tabs" part="tabs">${strip}</div>${activePanel ? controls(activePanel) : ""}</div><div class="xtyle-dock-zone__body" part="body" data-body-for="${escAttr(zoneId)}"></div></div>`;
  }
  function stackLeaf(node2) {
    const zoneId = node2.id ?? "";
    const sections = (node2.panels ?? []).map((panel) => {
      const collapsed = panel.collapsed === true;
      const pid = escAttr(panel.id);
      return `<div class="xtyle-dock-zone__section${collapsed ? " is-collapsed" : ""}" part="section"><div class="xtyle-dock-zone__section-head" part="section-head"><button type="button" class="xtyle-dock-zone__section-toggle" part="section-toggle" aria-expanded="${!collapsed}" data-section-toggle data-panel-id="${pid}" data-zone-id="${escAttr(zoneId)}" data-index="${panel.index}"><span class="xtyle-dock-zone__chevron" part="chevron" aria-hidden="true"></span><span class="xtyle-dock-zone__section-title" part="section-title">${esc(panel.title)}</span>${badge(panel)}</button>${controls(panel)}</div><div class="xtyle-dock-zone__section-body" part="section-body" data-section-body-for="${pid}"${collapsed ? " hidden" : ""}></div></div>`;
    }).join("");
    return `<div class="xtyle-dock-zone__leaf xtyle-dock-zone__leaf--stack" part="zone" data-zone-id="${escAttr(zoneId)}" style="flex:${node2.flex ?? 1}">${sections}</div>`;
  }
  function node(n) {
    if (n.kind === "split") {
      const direction = n.direction === "column" ? "column" : "row";
      const children = (n.children ?? []).map(node).join("");
      return `<div class="xtyle-dock-split xtyle-dock-split--${direction}" part="split" style="flex:${n.flex ?? 1}">${children}</div>`;
    }
    return n.mode === "stack" ? stackLeaf(n) : tabsLeaf(n);
  }
  function films(count) {
    let html = `<div class="xtyle-dock-zone__film xtyle-dock-zone__film--drop" part="film" data-film="drop" hidden></div><div class="xtyle-dock-zone__film xtyle-dock-zone__film--remnant" part="film" data-film="remnant" hidden></div>`;
    for (let i = 0; i < count; i += 1) {
      html += `<div class="xtyle-dock-zone__film xtyle-dock-zone__film--rest" part="film" data-film="rest" hidden></div>`;
    }
    return html;
  }
  function floatControl(panelId, verb, label, glyph) {
    const name = escAttr(label);
    return `<button type="button" class="xtyle-dock-zone__action" part="float-action" data-float-control ${verb} data-owner-panel="${escAttr(panelId)}" aria-label="${name}" title="${name}">${glyph}</button>`;
  }
  function floats(list) {
    if (list.length === 0) return "";
    const windows = list.map((f) => {
      const pid = escAttr(f.panelId);
      return `<div class="xtyle-dock-zone__float" part="float" data-float-id="${pid}" style="left:${f.x}px;top:${f.y}px;width:${f.w}px;height:${f.h}px"><div class="xtyle-dock-zone__float-head" part="float-head" data-float-head><span class="xtyle-dock-zone__float-title" part="float-title">${esc(f.title)}</span>` + floatControl(f.panelId, "data-float-dock", `Dock ${f.title}`, DOCK_GLYPH) + floatControl(f.panelId, "data-panel-close", `Close ${f.title}`, CLOSE_GLYPH) + `</div><div class="xtyle-dock-zone__float-body" part="float-body" data-float-body-for="${pid}"></div><div class="xtyle-dock-zone__float-resize" part="float-resize" data-float-resize data-owner-panel="${pid}" aria-hidden="true"></div></div>`;
    }).join("");
    return `<div class="xtyle-dock-zone__floats" part="floats">${windows}</div>`;
  }
  function overflowMenu(hasMenu) {
    if (!hasMenu) return "";
    return `<xtyle-menu context class="xtyle-dock-zone__menu" part="menu" data-panel-menu-popup label="Panel options"></xtyle-menu>`;
  }
  function workspace(b) {
    if (!b.tree) return "";
    return node(b.tree) + films(b.restFilms ?? 0) + floats(b.floats ?? []) + overflowMenu(b.hasMenu === true);
  }
  function paint(bindings, ops) {
    ops.replaceChildren("[data-dock-zone]", workspace(bindings));
  }
  hooks.fragment.mount("dock-zone", paint);
  hooks.fragment.update("dock-zone", paint);
})();
