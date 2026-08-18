import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { applyDocumentTheme, getInitialReducedMotion, getInitialTheme } from "./utils/theme";

applyDocumentTheme(getInitialTheme(), getInitialReducedMotion());

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);