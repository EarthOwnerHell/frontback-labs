import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    [react()],
    VitePWA({
      registerType: "autoUpdate", // Автоматическое обновление при изменении кода
      devOptions: {
        enabled: true, // Чтобы тестировать в процессе разработки
      },
    }),
  ],
});
