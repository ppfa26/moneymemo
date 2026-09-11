import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import aitDevtools from "@apps-in-toss/devtools/unplugin";

// allowedHosts: 샌드박스 미리보기(외부 호스트) 접근 허용용. 로컬 미리보기 전용이라
// 실제 .ait 빌드/배포에는 영향 없어요.
export default defineConfig({
  plugins: [aitDevtools.vite(), react()],
  server: {
    host: true,
    allowedHosts: true,
  },
  preview: {
    host: true,
    allowedHosts: true,
  },
});
