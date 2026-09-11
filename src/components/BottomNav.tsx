import { navigate } from "../router";
import type { Route } from "../router";

interface Props {
  current: Route["name"];
}

// 3탭: 홈 / 내역 / 내보내기
// ★ 전면광고는 '앱 실행 시'에만 띄우므로 탭 전환에는 광고를 넣지 않아요(편하게 사용).
const TABS: { name: Route["name"]; label: string; icon: string; route: Route }[] =
  [
    { name: "home", label: "홈", icon: "🏠", route: { name: "home" } },
    { name: "list", label: "내역", icon: "📄", route: { name: "list" } },
    { name: "export", label: "내보내기", icon: "📤", route: { name: "export" } },
  ];

export function BottomNav({ current }: Props) {
  return (
    <nav
      style={{
        display: "flex",
        borderTop: "1px solid var(--line)",
        background: "#fff",
        paddingBottom: "var(--safe-bottom)",
      }}
    >
      {TABS.map((t) => {
        const active = current === t.name;
        return (
          <button
            key={t.name}
            onClick={() => navigate(t.route)}
            style={{
              flex: 1,
              padding: "10px 0 12px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
              color: active ? "var(--orange)" : "var(--text-weak)",
              fontWeight: active ? 700 : 500,
              fontSize: 11,
            }}
          >
            <span style={{ fontSize: 20, opacity: active ? 1 : 0.6 }}>
              {t.icon}
            </span>
            {t.label}
          </button>
        );
      })}
    </nav>
  );
}
