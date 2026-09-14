import { useCallback, useEffect, useRef, useState } from "react";
import "./App.css";
import { initRoute, useRoute } from "./router";
import { useSafeArea } from "./hooks/useSafeArea";
import { loadMeta, markInterstitialShown } from "./storage";
import { AD_GROUP_IDS } from "./ads/adConfig";
import { showInterstitial } from "./ads/fullScreenAd";
import {
  decideLaunchInterstitial,
  markLaunchInterstitialShown,
} from "./ads/interstitialPolicy";
import { HomeScreen } from "./screens/HomeScreen";
import { ListScreen } from "./screens/ListScreen";
import { AddEditScreen } from "./screens/AddEditScreen";
import { DetailScreen } from "./screens/DetailScreen";
import { ExportScreen } from "./screens/ExportScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
import { LegalScreen } from "./screens/LegalScreen";
import { BottomNav } from "./components/BottomNav";
import { AdBanner } from "./components/AdBanner";
import { Toast } from "./components/Toast";

// 최초 진입 라우트 세팅 + 최초 실행 시각 기록(24시간 유예용)
initRoute();
loadMeta();

export default function App() {
  useSafeArea();
  const route = useRoute();
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => setToast(msg), []);

  // ★ 전면광고: 미니앱 실행 시 딱 1회만 (30분 쿨타임 + 가입 24h 유예).
  //   앱 사용 중에는 절대 안 띄워요. 광고 실패해도 앱은 그대로 사용 가능.
  const launchAdTried = useRef(false);
  useEffect(() => {
    if (launchAdTried.current) return;
    launchAdTried.current = true;

    const meta = loadMeta();
    const decision = decideLaunchInterstitial({
      now: Date.now(),
      firstLaunchAt: meta.firstLaunchAt,
      lastInterstitialAt: meta.lastInterstitialAt,
    });
    if (decision.allow) {
      markLaunchInterstitialShown();
      markInterstitialShown();
      // 실패/미지원이어도 그냥 흘려보냄 (기능 안 막음)
      void showInterstitial(AD_GROUP_IDS.interstitial);
    }
  }, []);

  // 화면 전환 시 스크롤 최상단으로
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [route]);

  // 하단 탭은 최상위 화면(홈/내역/내보내기)에서만 노출
  const showTab =
    route.name === "home" ||
    route.name === "list" ||
    route.name === "export";

  return (
    <div className="app">
      {renderScreen()}
      {showTab && (
        <div className="bottom-dock">
          <AdBanner />
          <BottomNav current={route.name} />
        </div>
      )}
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  );

  function renderScreen() {
    switch (route.name) {
      case "home":
        return <HomeScreen />;
      case "list":
        return <ListScreen initialFilter={route.filter} />;
      case "add":
        return <AddEditScreen category={route.category} onToast={showToast} />;
      case "edit":
        return <AddEditScreen editId={route.id} onToast={showToast} />;
      case "detail":
        return <DetailScreen id={route.id} onToast={showToast} />;
      case "export":
        return <ExportScreen onToast={showToast} />;
      case "settings":
        return <SettingsScreen onToast={showToast} />;
      case "terms":
        return <LegalScreen kind="terms" />;
      case "privacy":
        return <LegalScreen kind="privacy" />;
      default:
        return <HomeScreen />;
    }
  }
}
