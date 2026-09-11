import { defineConfig } from "@apps-in-toss/web-framework/config";

export default defineConfig({
  // ★ 토스 콘솔에 등록한 앱 정보와 반드시 일치해야 해요. (한글 앱 이름: 경조사비 메모장)
  appName: "gyeongjosa-memo",
  brand: {
    // 브랜드 메인 컬러 (오렌지)
    primaryColor: "#FF6F0F",
  },
  webView: {},
  permissions: [],
  webBundleDir: "dist",
});
