"use strict";
(() => {
  // packages/xtyle/src/elements/fragments/date-picker/mod.ts
  function escapeHtml(value) {
    return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function escapeAttr(value) {
    return escapeHtml(value).replace(/"/g, "&quot;");
  }
  function rootClass(b) {
    const size = b.size ?? "md";
    const mode = b.mode ?? "date";
    return [
      "xtyle-datepicker",
      size !== "md" && `xtyle-datepicker--${size}`,
      `xtyle-datepicker--${mode}`,
      b.disabled && "xtyle-datepicker--disabled",
      b.readonly && "xtyle-datepicker--readonly",
      b.invalid && "xtyle-datepicker--invalid"
    ].filter(Boolean).join(" ");
  }
  function isInteractive(b) {
    return b.disabled !== true && b.readonly !== true;
  }
  function showClear(b) {
    return b.clearable !== false && isInteractive(b) && b.hasValue === true;
  }
  function showsDate(b) {
    return (b.mode ?? "date") !== "time";
  }
  function showsTime(b) {
    return (b.mode ?? "date") !== "date";
  }
  var CALENDAR_GLYPH = '<svg class="xtyle-datepicker__glyph" part="calendar-glyph" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><rect x="1.5" y="3" width="13" height="11.5" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.2"></rect><path d="M1.5 6.5h13M5 1.5v3M11 1.5v3" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"></path></svg>';
  var CLOCK_GLYPH = '<svg class="xtyle-datepicker__glyph" part="clock-glyph" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><circle cx="8" cy="8" r="6.4" fill="none" stroke="currentColor" stroke-width="1.2"></circle><path d="M8 4.5V8l2.4 1.6" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"></path></svg>';
  var CLEAR_GLYPH = '<svg class="xtyle-datepicker__glyph" part="clear-glyph" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M4.5 4.5l7 7M11.5 4.5l-7 7" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"></path></svg>';
  function inputHtml(b, part) {
    const isDate = part === "date";
    const uid = b.uid ?? "xtyle-datepicker";
    const text = (isDate ? b.dateText : b.timeText) ?? "";
    const placeholder = (isDate ? b.datePlaceholder : b.timePlaceholder) ?? "";
    const name = (isDate ? b.dateLabel : b.timeLabel) ?? (isDate ? "Date" : "Time");
    const attrs = [
      `class="xtyle-control xtyle-datepicker__input xtyle-datepicker__input--${part}"`,
      `part="input-${part}"`,
      `id="${escapeAttr(`${uid}-${part}`)}"`,
      `data-part="${part}"`,
      'type="text"',
      'autocomplete="off"',
      'autocorrect="off"',
      'spellcheck="false"',
      'inputmode="numeric"',
      `value="${escapeAttr(text)}"`,
      `placeholder="${escapeAttr(placeholder)}"`,
      `aria-label="${escapeAttr(name)}"`,
      `aria-invalid="${b.invalid === true}"`,
      b.disabled ? "disabled" : null,
      b.readonly ? "readonly" : null,
      b.required ? "required" : null
    ].filter(Boolean).join(" ");
    return `<input ${attrs} />`;
  }
  function timeOptionHtml(option, index, selectedIndex) {
    const selected = option.selected === true;
    const tabbable = selectedIndex === -1 ? index === 0 : selected;
    const attrs = [
      'class="xtyle-datepicker__time-option"',
      'part="time-option"',
      'type="button"',
      'role="option"',
      `data-iso="${escapeAttr(option.iso)}"`,
      `aria-selected="${selected}"`,
      `tabindex="${tabbable ? 0 : -1}"`,
      selected ? 'data-selected=""' : null,
      option.disabled ? "disabled" : null
    ].filter(Boolean).join(" ");
    return `<button ${attrs}>${escapeHtml(option.label)}</button>`;
  }
  function timeListHtml(b) {
    const options = b.timeOptions ?? [];
    if (options.length === 0) return "";
    let selectedIndex = -1;
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected === true) selectedIndex = i;
    }
    const items = options.map((option, index) => timeOptionHtml(option, index, selectedIndex)).join("");
    const label = b.timeListLabel ?? b.timeLabel ?? "Time";
    return `<div class="xtyle-datepicker__times" part="times" role="listbox" aria-label="${escapeAttr(label)}" data-times>${items}</div>`;
  }
  function calendarHtml(b) {
    if (!showsDate(b) || !b.calendar) return "";
    const cal = b.calendar;
    const attrs = [
      'class="xtyle-datepicker__calendar"',
      'part="calendar"',
      "data-calendar",
      'mode="single"',
      cal.value ? `value="${escapeAttr(cal.value)}"` : null,
      cal.min ? `min="${escapeAttr(cal.min)}"` : null,
      cal.max ? `max="${escapeAttr(cal.max)}"` : null,
      cal.locale ? `locale="${escapeAttr(cal.locale)}"` : null,
      cal.timezone ? `timezone="${escapeAttr(cal.timezone)}"` : null,
      cal.size ? `size="${escapeAttr(cal.size)}"` : null,
      cal.label ? `label="${escapeAttr(cal.label)}"` : null,
      cal.firstDayOfWeek ? `first-day-of-week="${escapeAttr(cal.firstDayOfWeek)}"` : null
    ].filter(Boolean).join(" ");
    return `<xtyle-calendar ${attrs}></xtyle-calendar>`;
  }
  function panelHtml(b) {
    const body = `${calendarHtml(b)}${showsTime(b) ? timeListHtml(b) : ""}`;
    return `<div class="xtyle-datepicker__panel" part="panel" data-panel>${body}</div>`;
  }
  function controlHtml(b) {
    const uid = b.uid ?? "xtyle-datepicker";
    const panelId = b.panelId ?? `${uid}-panel`;
    const labelId = b.labelId ?? `${uid}-label`;
    const label = b.label ?? "";
    const labelledby = b.labelledby ?? null;
    const groupName = labelledby ? ` aria-labelledby="${escapeAttr(labelledby)}"` : label.length > 0 ? ` aria-labelledby="${escapeAttr(labelId)}"` : b.ariaLabel ? ` aria-label="${escapeAttr(b.ariaLabel)}"` : "";
    const inputs = (showsDate(b) ? inputHtml(b, "date") : "") + (showsTime(b) ? inputHtml(b, "time") : "");
    const clearHidden = showClear(b) ? "" : " hidden";
    const clearLabel = b.clearLabel ?? "Clear";
    const openLabel = b.openLabel ?? (showsDate(b) ? "Open calendar" : "Open time list");
    const triggerGlyph = showsDate(b) ? CALENDAR_GLYPH : CLOCK_GLYPH;
    const triggerDisabled = isInteractive(b) ? "" : " disabled";
    return `<div class="xtyle-datepicker__control" part="control" role="group"${groupName} data-control>` + inputs + `<button type="button" class="xtyle-datepicker__clear" part="clear" aria-label="${escapeAttr(clearLabel)}"${clearHidden}>${CLEAR_GLYPH}</button><button type="button" class="xtyle-datepicker__trigger" part="trigger" aria-label="${escapeAttr(openLabel)}" aria-haspopup="dialog" aria-expanded="${b.open === true}" aria-controls="${escapeAttr(panelId)}"${triggerDisabled}>${triggerGlyph}</button></div>`;
  }
  function inner(b) {
    const uid = b.uid ?? "xtyle-datepicker";
    const labelId = b.labelId ?? `${uid}-label`;
    const label = b.label ?? "";
    const labelHidden = label.length === 0 ? " hidden" : "";
    const star = b.required ? `<span class="xtyle-datepicker__required" part="required" aria-hidden="true">*</span>` : "";
    const panelLabel = b.panelLabel ?? "Choose a value";
    return `<span class="xtyle-datepicker__label" part="label" id="${escapeAttr(labelId)}"${labelHidden}>${escapeHtml(label)}${star}</span>` + controlHtml(b) + `<xtyle-popover class="xtyle-datepicker__popover" part="popover" panel-role="dialog" flush no-close-on-select label="${escapeAttr(panelLabel)}" placement="bottom" align="start" data-popover>` + panelHtml(b) + `</xtyle-popover>`;
  }
  hooks.fragment.mount("date-picker", (bindings, ops) => {
    ops.setAttr(".xtyle-datepicker", "class", rootClass(bindings));
    ops.replaceChildren("[data-datepicker]", inner(bindings));
  });
  hooks.fragment.update("date-picker", (bindings, ops) => {
    ops.setAttr(".xtyle-datepicker", "class", rootClass(bindings));
    ops.setAttr(".xtyle-datepicker__input--date", "value", bindings.dateText ?? "");
    ops.setAttr(".xtyle-datepicker__input--time", "value", bindings.timeText ?? "");
    ops.setAttr(".xtyle-datepicker__input--date", "aria-invalid", String(bindings.invalid === true));
    ops.setAttr(".xtyle-datepicker__input--time", "aria-invalid", String(bindings.invalid === true));
    ops.setAttr(".xtyle-datepicker__trigger", "aria-expanded", String(bindings.open === true));
    ops.toggle(".xtyle-datepicker__clear", showClear(bindings));
    const labelText = bindings.label ?? "";
    ops.setText(".xtyle-datepicker__label", labelText);
    ops.toggle(".xtyle-datepicker__label", labelText.length > 0);
    ops.setAttr(".xtyle-datepicker__time-option[data-selected]", "data-selected", "");
    ops.setAttr('.xtyle-datepicker__time-option[aria-selected="true"]', "aria-selected", "false");
    const selected = (bindings.timeOptions ?? []).filter((option) => option.selected === true)[0];
    if (selected) {
      const target = `.xtyle-datepicker__time-option[data-iso="${selected.iso}"]`;
      ops.setAttr(target, "aria-selected", "true");
      ops.setAttr(target, "data-selected", "selected");
    }
    const cal = bindings.calendar;
    if (cal) ops.setAttr("[data-calendar]", "value", cal.value ?? "");
  });
  xript.exports.register("commit", (payload) => {
    const e = payload;
    if (e.disabled) return {};
    return { commit: e.value ?? "" };
  });
  xript.exports.register("inputKeydown", (payload) => {
    const e = payload;
    if (e.disabled) return {};
    switch (e.key) {
      case "ArrowUp":
        return { nudge: 1, preventDefault: true };
      case "ArrowDown":
        return { nudge: -1, preventDefault: true };
      case "PageUp":
        return { nudge: 1, forceAlt: true, preventDefault: true };
      case "PageDown":
        return { nudge: -1, forceAlt: true, preventDefault: true };
      case "Enter":
        return { commit: e.value ?? "", preventDefault: true };
      case "Escape":
        return { closeMenu: true };
      default:
        return {};
    }
  });
  xript.exports.register("trigger", (payload) => {
    const e = payload;
    if (e.disabled) return {};
    return { toggleOpen: true };
  });
  xript.exports.register("clear", (payload) => {
    const e = payload;
    if (e.disabled) return {};
    return { clearValue: true, focusInput: true };
  });
  xript.exports.register("pickTime", (payload) => {
    const e = payload;
    if (e.disabled) return {};
    const iso = e.dataset ? e.dataset.iso : void 0;
    return iso ? { activateValue: iso } : {};
  });
  xript.exports.register("timeKeydown", (payload) => {
    const e = payload;
    if (e.disabled) return {};
    switch (e.key) {
      case "ArrowDown":
        return { nudge: 1, preventDefault: true };
      case "ArrowUp":
        return { nudge: -1, preventDefault: true };
      case "Home":
        return { openMenu: "first", preventDefault: true };
      case "End":
        return { openMenu: "last", preventDefault: true };
      default:
        return {};
    }
  });
})();
