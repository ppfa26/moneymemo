import { useCallback, useEffect, useState } from "react";
import "./App.css";
import { initRoute, useRoute } from "./router";
import { useSafeArea } from "./hooks/useSafeArea";
import { loadMeta } from "./storage";
import { HomeScreen } from "./screens/HomeScreen";
import { AddEditScreen } from "./screens/AddEditScreen";
import { ListScreen } from "./screens/ListScreen";
import { DetailScreen } from "./screens/DetailScreen";
import { ExportScreen } from "./screens/ExportScreen";
import { BottomNav } from "./components/BottomNav";
import { Toast } from "./components/Toast";

// 최초 진입 라우트 세팅 + 최초 실행 시각 기록(24시간 유예용)
initRoute();
loadMeta();

export default function App() {
  useSafeArea();
  const route = useRoute();
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => setToast(msg), []);

  // 화면 전환 시 스크롤 최상단으로
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [route]);

  // 하단 탭은 최상위 화면(홈/목록/내보내기)에서만 노출
  const showTab =
    route.name === "home" || route.name === "list" || route.name === "export";

  return (
    <div className="app">
      {renderScreen()}
      {showTab && <BottomNav current={route.name} />}
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  );

  function renderScreen() {
    switch (route.name) {
      case "home":
        return <HomeScreen />;
      case "add":
        return <AddEditScreen onToast={showToast} />;
      case "edit":
        return <AddEditScreen editId={route.id} onToast={showToast} />;
      case "list":
        return <ListScreen />;
      case "detail":
        return <DetailScreen id={route.id} onToast={showToast} />;
      case "export":
        return <ExportScreen onToast={showToast} />;
      default:
        return <HomeScreen />;
    }
  }
}
