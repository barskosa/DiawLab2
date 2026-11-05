import React, { lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { ThemeProvider } from "./Theme.jsx";
import { Logo } from "./components.jsx";
import "./tokens.css";
import "./styles.css";

const DesignSystem = lazy(() => import("./DesignSystem.jsx"));
const isDesignSystem =
  window.location.pathname.replace(/\/+$/, "") === "/design";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <Suspense
        fallback={
          <div className="initial-loading" role="status">
            <Logo />
            <p>Preparando o design system…</p>
          </div>
        }
      >
        {isDesignSystem ? <DesignSystem /> : <App />}
      </Suspense>
    </ThemeProvider>
  </React.StrictMode>,
);
