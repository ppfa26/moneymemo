import { defineConfig } from "@apps-in-toss/web-framework/config";

export default defineConfig({
  // ★ 토스 콘솔에 등록한 appName과 반드시 일치해야 해요.
  //   콘솔 앱 정보 화면의 appName = "moneymemo" (한글 표시명: 머니메모)
  appName: "moneymemo",
  brand: {
    // 브랜드 메인 컬러 (오렌지)
    primaryColor: "#FF6F0F",
  },
  webView: {},
  permissions: [],
  webBundleDir: "dist",
});
