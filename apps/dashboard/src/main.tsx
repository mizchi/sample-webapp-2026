import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/public-sans/400.css";
import "@fontsource/public-sans/600.css";
import "@fontsource/newsreader/700.css";
import { App } from "./App.tsx";
import { readInitialViewState } from "./lib/view-state.ts";
import "./styles.css";

const initialView = readInitialViewState();
const root = createRoot(document.getElementById("root")!);

async function bootstrap() {
  if ("fonts" in document) {
    await document.fonts.ready;
  }

  root.render(
    <StrictMode>
      <App
        initialSeverity={initialView.severity}
        initialFocusServiceId={initialView.focusServiceId}
      />
    </StrictMode>,
  );
}

void bootstrap();
