import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";
import { readInitialViewState } from "./lib/view-state.ts";
import "./styles.css";

const initialView = readInitialViewState();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App
      initialSeverity={initialView.severity}
      initialFocusServiceId={initialView.focusServiceId}
    />
  </StrictMode>,
);
