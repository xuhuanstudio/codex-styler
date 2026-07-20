(() => {
  const FACTORY_VERSION = 2;
  if (
    window.__CODEX_STYLER_CREATE_COMPOSER_SETTINGS_ADAPTER__?.version ===
    FACTORY_VERSION
  ) {
    return;
  }

  const ROOT_ID = "codex-styler-composer-moments";
  const FIELD_PATTERNS = {
    model: /^(model|模型)\b/i,
    reasoning: /^(effort|reasoning|reasoning effort|推理|推理强度)\b/i,
    speed: /^(speed|速度)\b/i,
  };

  const normalize = (value) =>
    String(value || "")
      .replace(/\s+/g, " ")
      .trim();

  const isVisible = (element) => {
    if (!(element instanceof HTMLElement) || !element.isConnected) return false;
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
        requestAnimationFrame(check);
      };
      check();
    });

  const dispatchEscape = () =>
    document.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Escape",
        bubbles: true,
        cancelable: true,
      }),
    );

  const createFactory = ({ resolveComposer }) => {
    let revision = 0;

    const clickNative = (element) => {
      if (!(element instanceof HTMLElement)) return;
      element.dataset.codexStylerAdapterBypass = "true";
      try {
        element.click();
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

    const openRootMenu = async () => {
      const trigger = resolveTrigger();
      if (!(trigger instanceof HTMLElement)) return null;
      if (
        trigger.getAttribute("data-state") !== "open" &&
        trigger.getAttribute("aria-expanded") !== "true"
      ) {
        clickNative(trigger);
      }
      return waitFor(() => visibleMenus().at(-1));
    };

    const closeMenus = () => {
      const trigger = resolveTrigger();
      if (
        trigger?.getAttribute("data-state") === "open" ||
        trigger?.getAttribute("aria-expanded") === "true"
      ) {
        clickNative(trigger);
      } else if (visibleMenus().length > 0) dispatchEscape();
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
        trigger?.querySelector("[data-model-picker-model-row]")?.textContent ||
          trigger?.dataset.modelLabel ||
          "",
      );

    const rowValue = (field, row, trigger) => {
      if (field === "model") {
        return (
          normalize(
            row?.querySelector("[data-model-picker-model-row]")?.textContent,
          ) || currentModel(trigger)
        );
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
      closeMenus();
      const reasoning = await inspectField("reasoning");
      closeMenus();
      const speed = await inspectField("speed");
      closeMenus();
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
      return inspectSnapshot(operationRevision);
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
      closeMenus();
      return true;
    };

    const apply = async (configuration) => {
      const operationRevision = ++revision;
      const before = await inspectSnapshot(operationRevision);
      if (!before.available || operationRevision !== revision) {
        return { ok: false, reason: before.reason || "unavailable" };
      }
      const changes = ["reasoning", "speed"].filter((field) => {
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
    };

    const destroy = () => {
      revision += 1;
      closeMenus();
    };

    const isTriggerTarget = (target) => {
      const trigger = resolveTrigger();
      return Boolean(
        trigger &&
        target instanceof Node &&
        (target === trigger || trigger.contains(target)),
      );
    };

    const openOfficialMenu = async () => openRootMenu();

    return {
      inspect,
      apply,
      destroy,
      resolveTrigger,
      isTriggerTarget,
      openOfficialMenu,
    };
  };

  createFactory.version = FACTORY_VERSION;
  window.__CODEX_STYLER_CREATE_COMPOSER_SETTINGS_ADAPTER__ = createFactory;
})();
