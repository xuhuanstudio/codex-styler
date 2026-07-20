(() => {
  const FACTORY_VERSION = 11;
  if (
    window.__CODEX_STYLER_CREATE_COMPOSER_SETTINGS_ADAPTER__?.version ===
    FACTORY_VERSION
  ) {
    return;
  }

  const ROOT_ID = "codex-styler-composer-moments";
  const FIELD_PATTERNS = {
    /* `\b` only understands ASCII word boundaries. Keep the English boundary,
       but match CJK labels with an explicit whitespace/end boundary. */
    model: /^(?:model\b|模型(?:\s|$))/i,
    reasoning: /^(?:effort\b|reasoning(?: effort)?\b|推理(?:强度)?(?:\s|$))/i,
    speed: /^(?:speed\b|速度(?:\s|$))/i,
  };

  const normalize = (value) =>
    String(value || "")
      .replace(/\s+/g, " ")
      .trim();

  const CONCEALED_ATTRIBUTE = "data-codex-styler-adapter-concealed";
  const PROBE_ATTRIBUTE = "data-codex-styler-settings-probe";
  const PROBE_STYLE_ID = "codex-styler-settings-probe-style";
  const KEYBOARD_ATTRIBUTE = "data-codex-styler-adapter-keyboard";

  const isVisible = (element) => {
    if (!(element instanceof HTMLElement) || !element.isConnected) return false;
    if (
      (element.getAttribute("role") === "menu" ||
        element.getAttribute("role") === "listbox") &&
      element.getAttribute("data-state") === "closed"
    ) {
      return false;
    }
    if (
      element.hidden ||
      element.closest("[hidden]") ||
      element.getAttribute("aria-hidden") === "true"
    ) {
      return false;
    }
    const style = getComputedStyle(element);
    return style.display !== "none" && style.visibility !== "hidden";
  };

  const waitFor = (resolve, timeout = 650) =>
    new Promise((finish) => {
      const startedAt = performance.now();
      const check = () => {
        const value = resolve();
        if (value || performance.now() - startedAt >= timeout) {
          finish(value || null);
          return;
        }
        /* Menu state may settle after the keyboard event. A short task delay
           avoids both re-entrant Radix toggles and synchronous rAF test shims. */
        window.setTimeout(check, 16);
      };
      check();
    });

  const dispatchEscape = () => {
    document.documentElement.setAttribute(KEYBOARD_ATTRIBUTE, "true");
    try {
      document.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Escape",
          bubbles: true,
          cancelable: true,
        }),
      );
    } finally {
      document.documentElement.removeAttribute(KEYBOARD_ATTRIBUTE);
    }
  };

  const createFactory = ({ resolveComposer }) => {
    let revision = 0;
    let probeDepth = 0;
    let probeObserver = null;

    const clickNative = (element) => {
      if (!(element instanceof HTMLElement)) return;
      element.dataset.codexStylerAdapterBypass = "true";
      try {
        element.click();
      } finally {
        delete element.dataset.codexStylerAdapterBypass;
      }
    };

    const openWithKeyboard = (element) => {
      if (!(element instanceof HTMLElement)) return;
      element.dataset.codexStylerAdapterBypass = "true";
      try {
        element.focus({ preventScroll: true });
        element.dispatchEvent(
          new KeyboardEvent("keydown", {
            key: "Enter",
            code: "Enter",
            bubbles: true,
            cancelable: true,
          }),
        );
        element.dispatchEvent(
          new KeyboardEvent("keyup", {
            key: "Enter",
            code: "Enter",
            bubbles: true,
            cancelable: true,
          }),
        );
      } finally {
        delete element.dataset.codexStylerAdapterBypass;
      }
    };

    const resolveTrigger = () => {
      const composer = resolveComposer?.();
      const candidates = [
        ...document.querySelectorAll("[data-codex-intelligence-trigger]"),
      ].filter((element) => isVisible(element));
      if (!composer || candidates.length < 2) return candidates[0] || null;
      const composerBounds = composer.getBoundingClientRect();
      return candidates.reduce((nearest, candidate) => {
        const bounds = candidate.getBoundingClientRect();
        const distance = Math.abs(bounds.bottom - composerBounds.bottom);
        return !nearest || distance < nearest.distance
          ? { element: candidate, distance }
          : nearest;
      }, null)?.element;
    };

    const visibleMenus = () =>
      [...document.querySelectorAll("[role='menu']")].filter(
        (element) => !element.closest(`#${ROOT_ID}`) && isVisible(element),
      );

    const concealMenu = (menu) => {
      if (!(menu instanceof HTMLElement)) return menu;
      menu.setAttribute(CONCEALED_ATTRIBUTE, "true");
      menu.style.setProperty("opacity", "0", "important");
      menu.style.setProperty("pointer-events", "none", "important");
      menu.style.setProperty("transition", "none", "important");
      menu.style.setProperty("animation", "none", "important");
      return menu;
    };

    const concealDiscoveredMenus = () => {
      document
        .querySelectorAll("[role='menu'], [role='listbox']")
        .forEach((menu) => {
          if (!menu.closest(`#${ROOT_ID}`)) concealMenu(menu);
        });
    };

    const beginSilentProbe = () => {
      probeDepth += 1;
      if (probeDepth > 1) return;
      if (!document.getElementById(PROBE_STYLE_ID)) {
        const style = document.createElement("style");
        style.id = PROBE_STYLE_ID;
        style.textContent = `
          html[${PROBE_ATTRIBUTE}="true"] [role="menu"],
          html[${PROBE_ATTRIBUTE}="true"] [role="listbox"],
          html[${PROBE_ATTRIBUTE}="true"] [data-radix-popper-content-wrapper] {
            opacity: 0 !important;
            pointer-events: none !important;
            transition: none !important;
            animation: none !important;
          }
        `;
        document.head.appendChild(style);
      }
      document.documentElement.setAttribute(PROBE_ATTRIBUTE, "true");
      concealDiscoveredMenus();
      probeObserver = new MutationObserver(concealDiscoveredMenus);
      probeObserver.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["hidden", "data-state", "aria-hidden"],
      });
    };

    const endSilentProbe = () => {
      probeDepth = Math.max(0, probeDepth - 1);
      if (probeDepth > 0) return;
      probeObserver?.disconnect();
      probeObserver = null;
      document.documentElement.removeAttribute(PROBE_ATTRIBUTE);
    };

    const revealMenus = () => {
      document.querySelectorAll(`[${CONCEALED_ATTRIBUTE}]`).forEach((menu) => {
        menu.removeAttribute(CONCEALED_ATTRIBUTE);
        if (menu instanceof HTMLElement) {
          menu.style.removeProperty("opacity");
          menu.style.removeProperty("pointer-events");
          menu.style.removeProperty("transition");
          menu.style.removeProperty("animation");
        }
      });
    };

    const openRootMenu = async ({ conceal = true } = {}) => {
      const trigger = resolveTrigger();
      if (!(trigger instanceof HTMLElement)) return null;
      let menu = visibleMenus().at(-1) || null;
      if (
        trigger.getAttribute("data-state") !== "open" &&
        trigger.getAttribute("aria-expanded") !== "true"
      ) {
        /* Radix ignores HTMLElement.click() for the current Codex trigger,
           while its keyboard contract remains stable and accessible. */
        openWithKeyboard(trigger);
        menu = await waitFor(() => visibleMenus().at(-1), 250);
        if (!menu) {
          clickNative(trigger);
          menu = await waitFor(() => visibleMenus().at(-1), 400);
        }
      }
      menu ||= await waitFor(() => visibleMenus().at(-1));
      return conceal ? concealMenu(menu) : menu;
    };

    const closeMenus = async ({ reveal = probeDepth === 0 } = {}) => {
      /* A submenu and its root are separate Radix layers. Close every active
         layer and wait for each state transition before reopening another row. */
      for (let attempt = 0; attempt < 4; attempt += 1) {
        const openCount = visibleMenus().length;
        if (openCount === 0) break;
        dispatchEscape();
        await waitFor(() => visibleMenus().length < openCount, 250);
      }
      if (reveal && visibleMenus().length === 0) revealMenus();
    };

    const silently = async (operation) => {
      beginSilentProbe();
      try {
        return await operation();
      } finally {
        await closeMenus({ reveal: false });
        endSilentProbe();
        if (visibleMenus().length === 0) revealMenus();
      }
    };

    const buttonText = (element) => normalize(element?.textContent);

    const optionLabel = (element) => {
      if (!(element instanceof HTMLElement)) return "";
      const accessibleLabel = normalize(element.getAttribute("aria-label"));
      if (accessibleLabel) return accessibleLabel;
      const copy = element.cloneNode(true);
      if (copy instanceof HTMLElement) {
        copy
          .querySelectorAll(
            ".text-token-description-foreground, [data-description], [data-slot='description']",
          )
          .forEach((description) => description.remove());
        const label = normalize(copy.textContent);
        if (label) return label;
      }
      return buttonText(element);
    };

    const closestInteractive = (element) =>
      element?.closest(
        "button, [role='menuitem'], [role='option'], [aria-haspopup='menu']",
      ) || null;

    const findRow = (field) => {
      if (field === "model") {
        const trigger = resolveTrigger();
        const marker = [
          ...document.querySelectorAll("[data-model-picker-model-row]"),
        ].find(
          (element) =>
            !element.closest(`#${ROOT_ID}`) &&
            isVisible(element) &&
            closestInteractive(element) !== trigger,
        );
        const interactive = closestInteractive(marker);
        if (interactive) return interactive;
      }
      const pattern = FIELD_PATTERNS[field];
      const candidates = [
        ...document.querySelectorAll(
          "button, [role='menuitem'], [aria-haspopup='menu']",
        ),
      ].filter(
        (element) =>
          !element.closest(`#${ROOT_ID}`) &&
          isVisible(element) &&
          (pattern.test(normalize(element.getAttribute("aria-label"))) ||
            pattern.test(buttonText(element))),
      );
      return candidates.find((element) => element !== resolveTrigger()) || null;
    };

    const currentModel = (trigger) =>
      normalize(
        trigger?.querySelector("[class*='ModelPickerTriggerModelText']")
          ?.textContent ||
          trigger?.querySelector("[data-model-picker-model-row]")
            ?.textContent ||
          trigger?.dataset.modelLabel ||
          "",
      );

    const rowValue = (field, row, trigger) => {
      if (field === "model") {
        const aria = normalize(row?.getAttribute("aria-label"));
        const ariaValue = normalize(aria.replace(FIELD_PATTERNS.model, ""));
        if (ariaValue) return ariaValue;
        const marker = row?.querySelector("[data-model-picker-model-row]");
        const siblingValue = normalize(
          marker?.parentElement?.nextElementSibling?.textContent,
        );
        return siblingValue || currentModel(trigger);
      }
      const aria = normalize(row?.getAttribute("aria-label"));
      const pattern = FIELD_PATTERNS[field];
      const ariaValue = normalize(aria.replace(pattern, ""));
      if (ariaValue) return ariaValue;
      const parts = [...(row?.querySelectorAll("span") || [])]
        .map((element) => normalize(element.textContent))
        .filter(Boolean);
      return parts.find((part) => !pattern.test(part)) || "";
    };

    const collectOptions = (container, currentLabel) => {
      const candidates = [
        ...container.querySelectorAll("[role='menuitem'], [role='option']"),
      ].filter(
        (element) => isVisible(element) && !element.closest(`#${ROOT_ID}`),
      );
      const options = [];
      const seen = new Set();
      candidates.forEach((element, index) => {
        const label = optionLabel(element);
        const key = label.toLocaleLowerCase();
        if (!label || seen.has(key)) return;
        seen.add(key);
        options.push({
          id: key || String(index),
          label,
          selected:
            element.getAttribute("data-reasoning-selected") === "true" ||
            element.getAttribute("data-model-selected") === "true" ||
            normalize(currentLabel).toLocaleLowerCase() === key,
        });
      });
      return options;
    };

    const inspectField = async (field) => {
      const trigger = resolveTrigger();
      const rootMenu = await openRootMenu();
      if (!rootMenu || !trigger) return null;
      const row = findRow(field);
      if (!row) {
        if (field !== "reasoning") return null;
        const selected = rootMenu.querySelector(
          "[data-reasoning-selected='true']",
        );
        if (!selected) return null;
        const options = collectOptions(rootMenu, buttonText(selected));
        return {
          current: options.find((option) => option.selected) || null,
          options,
        };
      }
      const currentLabel = rowValue(field, row, trigger);
      row.click();
      const optionsMenu = await waitFor(() => {
        const menus = visibleMenus();
        return menus.length > 1 ? menus.at(-1) : null;
      });
      concealMenu(optionsMenu);
      const options = optionsMenu
        ? collectOptions(optionsMenu, currentLabel)
        : [];
      return {
        current:
          options.find((option) => option.selected) ||
          (currentLabel
            ? {
                id: currentLabel.toLocaleLowerCase(),
                label: currentLabel,
                selected: true,
              }
            : null),
        options,
      };
    };

    const inspectSnapshot = async (operationRevision) => {
      const trigger = resolveTrigger();
      if (!trigger) {
        return {
          available: false,
          reason: "trigger-missing",
          model: null,
          reasoning: null,
          speed: null,
        };
      }
      const modelLabel = currentModel(trigger);
      const model = await inspectField("model");
      await closeMenus();
      const reasoning = await inspectField("reasoning");
      await closeMenus();
      const speed = await inspectField("speed");
      await closeMenus();
      if (operationRevision !== revision) {
        return { available: false, reason: "stale" };
      }
      return {
        available: Boolean(reasoning?.current && reasoning.options.length > 1),
        reason:
          reasoning?.current && reasoning.options.length > 1
            ? null
            : "reasoning-options-missing",
        model:
          model ||
          (modelLabel
            ? {
                current: {
                  id: modelLabel.toLocaleLowerCase(),
                  label: modelLabel,
                  selected: true,
                },
                options: [],
              }
            : null),
        reasoning,
        speed,
      };
    };

    const inspect = async () => {
      const operationRevision = ++revision;
      return silently(() => inspectSnapshot(operationRevision));
    };

    const selectField = async (field, target) => {
      if (!target?.label) return true;
      const rootMenu = await openRootMenu();
      if (!rootMenu) return false;
      let optionsMenu = rootMenu;
      const row = findRow(field);
      if (row) {
        row.click();
        optionsMenu =
          (await waitFor(() => {
            const menus = visibleMenus();
            return menus.length > 1 ? menus.at(-1) : null;
          })) || rootMenu;
      }
      const normalizedTarget = normalize(target.label).toLocaleLowerCase();
      const option = [
        ...optionsMenu.querySelectorAll("[role='menuitem'], [role='option']"),
      ].find(
        (element) =>
          isVisible(element) &&
          optionLabel(element).toLocaleLowerCase() === normalizedTarget,
      );
      if (!(option instanceof HTMLElement)) return false;
      option.click();
      await new Promise((resolve) => window.setTimeout(resolve, 40));
      await closeMenus();
      return true;
    };

    const apply = async (configuration) => {
      const operationRevision = ++revision;
      return silently(async () => {
        const before = await inspectSnapshot(operationRevision);
        if (!before.available || operationRevision !== revision) {
          return { ok: false, reason: before.reason || "unavailable" };
        }
        const changes = ["model", "reasoning", "speed"].filter((field) => {
          const target = configuration?.[field];
          const current = before[field]?.current;
          return target?.label && current?.label !== target.label;
        });
        for (const field of changes) {
          const selected = await selectField(field, configuration[field]);
          if (!selected)
            return { ok: false, reason: `${field}-selection-failed` };
          if (operationRevision !== revision) {
            return { ok: false, reason: "stale" };
          }
        }
        const after = await inspectSnapshot(operationRevision);
        if (operationRevision !== revision) {
          return { ok: false, reason: "stale" };
        }
        const verified = changes.every(
          (field) =>
            normalize(after[field]?.current?.label).toLocaleLowerCase() ===
            normalize(configuration[field]?.label).toLocaleLowerCase(),
        );
        return {
          ok: verified,
          reason: verified ? null : "verification-failed",
          before,
          after,
        };
      });
    };

    const destroy = () => {
      revision += 1;
      probeDepth = 0;
      probeObserver?.disconnect();
      probeObserver = null;
      document.documentElement.removeAttribute(PROBE_ATTRIBUTE);
      document.getElementById(PROBE_STYLE_ID)?.remove();
      void closeMenus();
    };

    const isTriggerTarget = (target) => {
      const trigger = resolveTrigger();
      return Boolean(
        trigger &&
        target instanceof Node &&
        (target === trigger || trigger.contains(target)),
      );
    };

    const showOfficialMenu = async () => {
      await closeMenus();
      return openRootMenu({ conceal: false });
    };

    return {
      inspect,
      apply,
      destroy,
      close: closeMenus,
      resolveTrigger,
      isTriggerTarget,
      openOfficialMenu: showOfficialMenu,
    };
  };

  createFactory.version = FACTORY_VERSION;
  window.__CODEX_STYLER_CREATE_COMPOSER_SETTINGS_ADAPTER__ = createFactory;
})();
