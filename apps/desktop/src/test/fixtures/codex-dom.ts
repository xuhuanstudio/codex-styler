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
