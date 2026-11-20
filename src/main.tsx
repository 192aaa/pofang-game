import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { TabooApp } from "./taboo/TabooApp";
import "./globals.css";

const taboo = new URLSearchParams(window.location.search).get("mode") === "taboo";

createRoot(document.getElementById("root")!).render(
  <StrictMode>{taboo ? <TabooApp /> : <App />}</StrictMode>,
);
