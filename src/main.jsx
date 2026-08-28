import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import "./firebase";
import { initFirebaseAppCheck } from "./utils/appCheck";
import { applyDocumentTheme, getInitialReducedMotion, getInitialTheme } from "./utils/theme";
import { applyDocumentZoom, getInitialZoom } from "./utils/zoom";

initFirebaseAppCheck();
applyDocumentTheme(getInitialTheme(), getInitialReducedMotion());
applyDocumentZoom(getInitialZoom());

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);