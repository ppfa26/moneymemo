import { useMemo, useState } from "react";
import { goBack, navigate } from "../router";
import { getRecord, upsertRecord } from "../storage";
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

  function handleSave() {
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

    onToast(isEdit ? "수정했어요" : "저장했어요");

    // ★ 저장 직후에는 광고를 넣지 않아요.
    //   "기록하기"는 앱의 핵심 액션이라 방해하면 이탈로 이어져요.
    //   전면광고는 상세 화면을 보고 나갈 때(콘텐츠 소비 후)로 옮겼어요.

    // 저장 후 상세로 이동 (추가는 뒤로가면 홈)
    if (isEdit) {
      goBack();
    } else {
      navigate({ name: "detail", id: record.id });
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>{isEdit ? "기록 수정" : "새 기록 추가"}</h1>
        <div className="sub">누구와 · 언제 · 얼마를 남겨요</div>
      </div>

      <div className="page-body">
        {/* 방향 토글 */}
        <div className="field">
          <label>받았나요, 냈나요?</label>
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
          <label>누구인가요?</label>
          <input
            className="text-input"
            placeholder="이름을 입력해요 (예: 김철수)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* 관계 */}
        <div className="field">
          <label>어떤 사이예요?</label>
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
          <label>무슨 경조사예요?</label>
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
          <label>얼마인가요?</label>
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
          <label>언제였나요?</label>
          <input
            type="date"
            className="text-input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        {/* 사진 첨부 */}
        <div className="field">
          <label>사진을 남겨둘까요? (선택)</label>
          <PhotoAttach photos={photos} onChange={setPhotos} onToast={onToast} />
        </div>

        {/* 메모 */}
        <div className="field">
          <label>메모 (선택)</label>
          <textarea
            className="text-input"
            placeholder="기억해두고 싶은 내용을 적어요"
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
          {saving ? "저장하고 있어요…" : isEdit ? "수정 완료" : "저장하기"}
        </button>
      </div>
    </div>
  );
}
