// 아주 가벼운 history 기반 라우터.
//
// ★ 심사 주의: 커스텀 헤더에 뒤로가기(←) 버튼을 넣지 않아요.
//   토스가 자체 상단바(< 앱이름 ⋯ X)를 제공하므로, 그 back이 누르면
//   브라우저 history의 popstate가 발생해요. 우리는 popstate만 구독해서
//   화면 상태를 되돌리면 돼요 (시스템 back 핸들링).

import { useEffect, useState } from "react";
import type { Category } from "./types";

export type Route =
  | { name: "home" }
  | { name: "list"; filter?: Category }
  | { name: "add"; category?: Category }
  | { name: "edit"; id: string }
  | { name: "detail"; id: string }
  | { name: "export" }
  | { name: "settings" }
  | { name: "terms" }
  | { name: "privacy" };

function readRoute(): Route {
  const state = window.history.state as Route | null;
  if (state && typeof state.name === "string") {
    return state;
  }
  return { name: "home" };
}

/** 새 화면으로 이동 (history push) */
export function navigate(route: Route): void {
  window.history.pushState(route, "", "");
  window.dispatchEvent(new PopStateEvent("popstate", { state: route }));
}

/** 이전 화면으로 (직접 back 버튼이 필요할 때만 - 보통은 토스 상단바 사용) */
export function goBack(): void {
  window.history.back();
}

/** 현재 라우트를 구독하는 훅 */
export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => readRoute());

  useEffect(() => {
    const onPop = () => setRoute(readRoute());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  return route;
}

/** 앱 시작 시 최초 라우트 세팅 (history 진입점 보장)
 *  ?screen=list|export 같은 쿼리로 진입하면 해당 화면에서 시작해요(딥링크). */
export function initRoute(): void {
  if (window.history.state != null) return;

  let initial: Route = { name: "home" };
  try {
    const params = new URLSearchParams(window.location.search);
    const screen = params.get("screen");
    const id = params.get("id");
    const filter = params.get("filter");
    const validFilters = ["salary", "expense", "gift", "saving"];
    if (screen === "export") initial = { name: "export" };
    else if (screen === "list")
      initial = {
        name: "list",
        ...(filter && validFilters.includes(filter)
          ? { filter: filter as Category }
          : {}),
      };
    else if (screen === "settings") initial = { name: "settings" };
    else if (screen === "terms") initial = { name: "terms" };
    else if (screen === "privacy") initial = { name: "privacy" };
    else if (screen === "add") initial = { name: "add" };
    else if (screen === "detail" && id) initial = { name: "detail", id };
  } catch {
    /* noop */
  }
  window.history.replaceState(initial, "", "");
}
