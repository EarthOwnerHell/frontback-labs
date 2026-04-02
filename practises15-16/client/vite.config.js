import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  server: {
    https: {
      key: fs.readFileSync(path.resolve(__dirname, "../localhost+2-key.pem")),
      cert: fs.readFileSync(path.resolve(__dirname, "../localhost+2.pem")),
    },
    port: 3000,
  },
});
