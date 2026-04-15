import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { registerSW } from "virtual:pwa-register";

// регистрация воркера
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm("Доступно обновление. Обновить?")) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log("Приложение готово к работе офлайн");
  },
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
