import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { Router } from "wouter";

const currentPath = window.location.pathname.endsWith("popup.html")
  ? "/"
  : window.location.pathname;

createRoot(document.getElementById("root")!).render(
  <Router hook={() => [currentPath, (to) => (window.location.pathname = to)]}>
    <App />
  </Router>
);
