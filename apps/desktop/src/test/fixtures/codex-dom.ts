export type CodexFixturePage = "home" | "task" | "settings" | "right-panel";

export function codexFixture(page: CodexFixturePage): string {
  if (page === "settings") {
    return `
      <div id="root">
        <main class="main-surface" data-page="settings">
          <nav aria-label="Settings sections">
            <button role="tab" aria-selected="true">General</button>
            <button role="tab" aria-selected="false">Appearance</button>
          </nav>
          <section role="tabpanel">General settings</section>
        </main>
      </div>
    `;
  }

  const pageContent =
    page === "home"
      ? `
          <div data-testid="home-icon"></div>
          <section class="group/home-suggestions"></section>
          <div data-feature="game-source"></div>
        `
      : `
          <section data-testid="conversation-thread">
            <article data-message-author-role="user">
              <p class="text-token-text-primary">Refine the task experience</p>
            </article>
            <article data-message-author-role="assistant">
              <p class="text-token-text-primary">Implementation plan</p>
              <small class="text-token-text-secondary">Two of three steps complete</small>
              <progress max="3" value="2"></progress>
              <details open>
                <summary>Run checks</summary>
                <pre><code>pnpm test</code><samp>All checks passed</samp></pre>
              </details>
              <p><del>legacy surface</del> <ins>semantic surface</ins></p>
              <table>
                <thead><tr><th>File</th><th>Change</th></tr></thead>
                <tbody><tr><td>runtime.js</td><td>Updated</td></tr></tbody>
              </table>
            </article>
          </section>
          <div class="composer-surface-chrome" contenteditable="true">
            <span data-placeholder="Ask Codex"></span>
          </div>
        `;
  const rightPanel =
    page === "right-panel"
      ? `
          <aside data-pip-obstacle="thread-summary-panel">
            <div role="tablist" aria-label="Task details">
              <button role="tab" aria-selected="true">Changes</button>
              <button role="tab" aria-selected="false">Terminal</button>
            </div>
            <section role="tabpanel">Changed files</section>
          </aside>
        `
      : "";

  return `
    <div id="root">
      <aside class="app-shell-left-panel"><nav>Codex</nav></aside>
      <main class="main-surface">
        <header class="app-header-tint">Task header</header>
        <div role="main">${pageContent}</div>
      </main>
      ${rightPanel}
    </div>
  `;
}

export function portalFixture(kind: "dialog" | "toast" | "menu"): HTMLElement {
  const portal = document.createElement("div");
  portal.dataset.fixturePortal = kind;
  if (kind === "dialog") {
    portal.innerHTML = '<div role="dialog">Theme settings</div>';
  } else if (kind === "toast") {
    portal.innerHTML = '<div role="status">Theme applied</div>';
  } else {
    portal.innerHTML =
      '<div role="menu"><button role="menuitem">Open</button></div>';
  }
  return portal;
}

export function installCodexIntelligenceFixture(): void {
  const composer = document.querySelector(".composer-surface-chrome");
  if (
    !composer ||
    document.querySelector("[data-codex-intelligence-trigger]")
  ) {
    return;
  }
  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.dataset.codexIntelligenceTrigger = "true";
  trigger.dataset.selectedReasoningEffort = "high";
  trigger.dataset.state = "closed";
  trigger.setAttribute("aria-haspopup", "menu");
  trigger.innerHTML = `
    <span data-model-picker-model-row>5.6 Sol</span>
    <span data-fixture-effort-label>High</span>
  `;

  const rootMenu = document.createElement("div");
  rootMenu.setAttribute("role", "menu");
  rootMenu.hidden = true;
  const modelRow = document.createElement("button");
  modelRow.type = "button";
  modelRow.setAttribute("aria-label", "Model 5.6 Sol");
  modelRow.innerHTML = "<span data-model-picker-model-row>5.6 Sol</span>";
  const reasoningRow = document.createElement("button");
  reasoningRow.type = "button";
  reasoningRow.setAttribute("aria-label", "Effort High");
  reasoningRow.textContent = "Effort High";
  const speedRow = document.createElement("button");
  speedRow.type = "button";
  speedRow.setAttribute("aria-label", "Speed Fast");
  speedRow.textContent = "Speed Fast";
  rootMenu.append(modelRow, reasoningRow, speedRow);

  const createOptions = (
    field: "model" | "reasoning" | "speed",
    labels: string[],
    selected: string,
  ) => {
    const menu = document.createElement("div");
    menu.setAttribute("role", "menu");
    menu.dataset.fixtureField = field;
    menu.hidden = true;
    labels.forEach((label) => {
      const option = document.createElement("button");
      option.type = "button";
      option.setAttribute("role", "menuitem");
      option.textContent = label;
      if (label === selected && field === "reasoning") {
        option.dataset.reasoningSelected = "true";
      }
      option.addEventListener("click", () => {
        if (field === "model") {
          trigger.querySelector("[data-model-picker-model-row]")!.textContent =
            label;
          modelRow.querySelector("[data-model-picker-model-row]")!.textContent =
            label;
          modelRow.setAttribute("aria-label", `Model ${label}`);
        } else if (field === "reasoning") {
          const effortId = label.toLocaleLowerCase().replaceAll(" ", "-");
          trigger.dataset.selectedReasoningEffort = effortId;
          trigger.querySelector("[data-fixture-effort-label]")!.textContent =
            label;
          reasoningRow.setAttribute("aria-label", `Effort ${label}`);
          reasoningRow.textContent = `Effort ${label}`;
          menu
            .querySelectorAll("[data-reasoning-selected]")
            .forEach((item) => item.removeAttribute("data-reasoning-selected"));
          option.dataset.reasoningSelected = "true";
        } else {
          speedRow.setAttribute("aria-label", `Speed ${label}`);
          speedRow.textContent = `Speed ${label}`;
        }
        rootMenu.hidden = true;
        menu.hidden = true;
        trigger.dataset.state = "closed";
      });
      menu.appendChild(option);
    });
    return menu;
  };

  const modelMenu = createOptions("model", ["5.6 Sol", "5.4"], "5.6 Sol");
  const reasoningMenu = createOptions(
    "reasoning",
    ["Low", "Medium", "High", "Extra High"],
    "High",
  );
  const speedMenu = createOptions("speed", ["Standard", "Fast"], "Fast");
  const closeAll = () => {
    rootMenu.hidden = true;
    modelMenu.hidden = true;
    reasoningMenu.hidden = true;
    speedMenu.hidden = true;
    trigger.dataset.state = "closed";
  };
  trigger.addEventListener("click", () => {
    const opening = trigger.dataset.state !== "open";
    closeAll();
    trigger.dataset.state = opening ? "open" : "closed";
    rootMenu.hidden = !opening;
  });
  trigger.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    /* The real Radix trigger commits its open state after the keyboard event.
       Keep the fixture asynchronous so adapters cannot rely on a synchronous
       data-state mutation and then accidentally send a second toggle. */
    window.setTimeout(() => {
      const opening = trigger.dataset.state !== "open";
      closeAll();
      trigger.dataset.state = opening ? "open" : "closed";
      rootMenu.hidden = !opening;
    }, 0);
  });
  modelRow.addEventListener("click", () => {
    modelMenu.hidden = false;
  });
  reasoningRow.addEventListener("click", () => {
    reasoningMenu.hidden = false;
  });
  speedRow.addEventListener("click", () => {
    speedMenu.hidden = false;
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && trigger.isConnected) closeAll();
  });
  composer.parentElement?.insertBefore(trigger, composer);
  document.body.append(rootMenu, modelMenu, reasoningMenu, speedMenu);
}
