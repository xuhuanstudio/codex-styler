import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./styles.css";
import "./styles/tokens.css";
import "./styles/primitives.css";
import "./styles/libraries.css";
import "./styles/workspaces.css";
import "./styles/settings.css";
import "./styles/editor.css";
import "./styles/creator-beta3.css";
import "./styles/interaction-surfaces.css";
import "./styles/typography.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
