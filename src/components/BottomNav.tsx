import { navigate } from "../router";
import type { Route } from "../router";
import { loadMeta, markInterstitialShown } from "../storage";
import { AD_GROUP_IDS } from "../ads/adConfig";
import { showInterstitial } from "../ads/fullScreenAd";
import {
  decideInterstitial,
  getLastViewedEventType,
  hasViewedDetail,
  incrementSessionCount,
  resetDetailViewed,
} from "../ads/interstitialPolicy";

interface Props {
  current: Route["name"];
}

const TABS: { name: Route["name"]; label: string; icon: string; route: Route }[] =
  [
    { name: "home", label: "홈", icon: "🏠", route: { name: "home" } },
    { name: "list", label: "전체", icon: "📋", route: { name: "list" } },
    { name: "export", label: "내보내기", icon: "📤", route: { name: "export" } },
  ];

export function BottomNav({ current }: Props) {
  async function handleTab(name: Route["name"], route: Route) {
    // ★ 전면광고 배치: "상세를 보고 나서 홈으로 돌아올 때"만.
    //   콘텐츠 소비 후 전환 시점이라 자연스럽고 심사에도 안전해요.
    //   장례/24h유예/세션1회/5분쿨타임은 정책이 막아줘요. 광고 실패해도 그냥 이동.
    if (name === "home" && current !== "home" && hasViewedDetail()) {
      const meta = loadMeta();
      const decision = decideInterstitial({
        now: Date.now(),
        firstLaunchAt: meta.firstLaunchAt,
        lastInterstitialAt: meta.lastInterstitialAt,
        eventType: getLastViewedEventType(),
      });
      resetDetailViewed();
      if (decision.allow) {
        incrementSessionCount();
        markInterstitialShown();
        await showInterstitial(AD_GROUP_IDS.interstitial);
      }
    }
    navigate(route);
  }

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
            onClick={() => handleTab(t.name, t.route)}
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
