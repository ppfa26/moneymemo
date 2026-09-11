import { useMemo, useState } from "react";
import { goBack, navigate } from "../router";
import {
  getRecord,
  loadMeta,
  markInterstitialShown,
  upsertRecord,
} from "../storage";
import type {
  Direction,
  EventType,
  PhotoAttachment,
  Record,
  Relation,
} from "../types";
import { DIRECTION_LABEL, EVENT_LABEL, RELATION_LABEL } from "../types";
import { formatMoney, todayISO, uid } from "../utils";
import { PhotoAttach } from "../components/PhotoAttach";
import { AD_GROUP_IDS } from "../ads/adConfig";
import { showInterstitial } from "../ads/fullScreenAd";
import {
  decideInterstitialAfterSave,
  incrementSessionCount,
} from "../ads/interstitialPolicy";

const RELATIONS: Relation[] = ["friend", "work", "family", "etc"];
const EVENTS: EventType[] = ["wedding", "funeral", "firstbirthday", "etc"];
const AMOUNT_CHIPS = [30000, 50000, 100000, 200000, 300000, 500000];

interface Props {
  editId?: string;
  onToast: (msg: string) => void;
}

export function AddEditScreen({ editId, onToast }: Props) {
  const existing = useMemo(
    () => (editId ? getRecord(editId) : undefined),
    [editId],
  );
  const isEdit = existing != null;

  const [direction, setDirection] = useState<Direction>(
    existing?.direction ?? "given",
  );
  const [name, setName] = useState(existing?.name ?? "");
  const [relation, setRelation] = useState<Relation>(
    existing?.relation ?? "friend",
  );
  const [eventType, setEventType] = useState<EventType>(
    existing?.eventType ?? "wedding",
  );
  const [amount, setAmount] = useState<string>(
    existing ? String(existing.amount) : "",
  );
  const [date, setDate] = useState(existing?.date ?? todayISO());
  const [memo, setMemo] = useState(existing?.memo ?? "");
  const [photos, setPhotos] = useState<PhotoAttachment[]>(
    existing?.photos ?? [],
  );
  const [saving, setSaving] = useState(false);

  const amountNum = Number(amount.replace(/[^0-9]/g, "")) || 0;
  const canSave = name.trim().length > 0 && amountNum > 0;

  async function handleSave() {
    if (!canSave || saving) return;
    setSaving(true);

    const now = Date.now();
    const record: Record = {
      id: existing?.id ?? uid(),
      direction,
      name: name.trim(),
      relation,
      eventType,
      amount: amountNum,
      date,
      memo: memo.trim() || undefined,
      photos,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    upsertRecord(record);

    onToast(isEdit ? "수정되었어요" : "저장되었어요");

    // ★ 전면광고: "저장 완료" 직후에만, 정책 통과 시에만.
    //   장례 기록/24시간 유예/세션캡/쿨타임은 정책 함수가 막아줘요.
    if (!isEdit) {
      const meta = loadMeta();
      const decision = decideInterstitialAfterSave({
        now,
        firstLaunchAt: meta.firstLaunchAt,
        lastInterstitialAt: meta.lastInterstitialAt,
        eventType,
      });
      if (decision.allow) {
        incrementSessionCount();
        markInterstitialShown();
        // 광고는 흐름을 막지 않도록 await만 하고 결과와 무관하게 진행
        await showInterstitial(AD_GROUP_IDS.interstitial);
      }
    }

    // 저장 후 상세로 이동 (추가는 replace 느낌으로 뒤로가면 홈)
    if (isEdit) {
      goBack();
    } else {
      navigate({ name: "detail", id: record.id });
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>{isEdit ? "기록 수정" : "새 기록"}</h1>
        <div className="sub">누구에게 · 언제 · 얼마</div>
      </div>

      <div className="page-body">
        {/* 방향 토글 */}
        <div className="field">
          <label>방향</label>
          <div className="segment two">
            {(["received", "given"] as Direction[]).map((d) => (
              <button
                key={d}
                className={`seg ${direction === d ? `active dir-${d}` : ""}`}
                onClick={() => setDirection(d)}
              >
                {d === "received" ? "🎁 " : "💸 "}
                {DIRECTION_LABEL[d]}
              </button>
            ))}
          </div>
        </div>

        {/* 이름 */}
        <div className="field">
          <label>이름</label>
          <input
            className="text-input"
            placeholder="예: 김철수"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* 관계 */}
        <div className="field">
          <label>관계</label>
          <div className="segment">
            {RELATIONS.map((r) => (
              <button
                key={r}
                className={`seg ${relation === r ? "active" : ""}`}
                onClick={() => setRelation(r)}
              >
                {RELATION_LABEL[r]}
              </button>
            ))}
          </div>
        </div>

        {/* 경조사 종류 */}
        <div className="field">
          <label>경조사 종류</label>
          <div className="segment">
            {EVENTS.map((e) => (
              <button
                key={e}
                className={`seg ${eventType === e ? "active" : ""}`}
                onClick={() => setEventType(e)}
              >
                {EVENT_LABEL[e]}
              </button>
            ))}
          </div>
        </div>

        {/* 금액 */}
        <div className="field">
          <label>금액</label>
          <div className="amount-input">
            <input
              inputMode="numeric"
              placeholder="0"
              value={amount ? formatMoney(amountNum) : ""}
              onChange={(e) => setAmount(e.target.value)}
            />
            <span className="won">원</span>
          </div>
          <div className="chips">
            {AMOUNT_CHIPS.map((c) => (
              <button
                key={c}
                className="chip"
                onClick={() => setAmount(String(amountNum + c))}
              >
                +{formatMoney(c)}
              </button>
            ))}
            <button className="chip" onClick={() => setAmount("")}>
              초기화
            </button>
          </div>
        </div>

        {/* 날짜 */}
        <div className="field">
          <label>날짜</label>
          <input
            type="date"
            className="text-input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        {/* 사진 첨부 */}
        <div className="field">
          <label>사진 (청첩장 · 부고장 · 이체내역)</label>
          <PhotoAttach photos={photos} onChange={setPhotos} onToast={onToast} />
        </div>

        {/* 메모 */}
        <div className="field">
          <label>메모 (선택)</label>
          <textarea
            className="text-input"
            placeholder="예: 결혼식 축의금"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
          />
        </div>
      </div>

      <div className="fixed-bottom">
        <button
          className="btn btn-primary btn-block btn-lg"
          disabled={!canSave || saving}
          onClick={handleSave}
        >
          {saving ? "저장 중…" : isEdit ? "수정 완료" : "저장하기"}
        </button>
      </div>
    </div>
  );
}
