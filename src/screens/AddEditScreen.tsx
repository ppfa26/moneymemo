import { useMemo, useState } from "react";
import { goBack, navigate } from "../router";
import { getRecord, upsertRecord } from "../storage";
import type {
  Flow,
  Kind,
  PayMethod,
  PhotoAttachment,
  Record,
} from "../types";
import { PAY_METHOD_LABEL } from "../types";
import { formatMoney, todayISO, uid } from "../utils";
import { PhotoAttach } from "../components/PhotoAttach";

const PAY_METHODS: PayMethod[] = ["card", "transfer", "auto", "cash", "etc"];
const AMOUNT_CHIPS = [10000, 30000, 50000, 100000, 300000, 500000];
// 경조사비 사유 빠른 선택
const REASON_CHIPS = ["결혼", "장례", "돌잔치", "생일", "출산", "개업"];

interface Props {
  /** 새 기록 추가 시의 종류 (편집이면 무시하고 기존 기록의 kind 사용) */
  kind?: Kind;
  editId?: string;
  onToast: (msg: string) => void;
}

export function AddEditScreen({ kind: kindProp, editId, onToast }: Props) {
  const existing = useMemo(
    () => (editId ? getRecord(editId) : undefined),
    [editId],
  );
  const isEdit = existing != null;

  // 편집이면 기존 kind, 추가면 prop kind (기본 expense)
  const kind: Kind = existing?.kind ?? kindProp ?? "expense";
  const isExpense = kind === "expense";

  // 공통
  const [flow, setFlow] = useState<Flow>(existing?.flow ?? "out");
  const [name, setName] = useState(existing?.name ?? "");
  const [amount, setAmount] = useState<string>(
    existing ? String(existing.amount) : "",
  );
  const [date, setDate] = useState(existing?.date ?? todayISO());
  const [memo, setMemo] = useState(existing?.memo ?? "");
  const [photos, setPhotos] = useState<PhotoAttachment[]>(
    existing?.photos ?? [],
  );

  // 고정지출 전용
  const [payMethod, setPayMethod] = useState<PayMethod>(
    existing?.kind === "expense" ? existing.payMethod : "card",
  );
  const [payDay, setPayDay] = useState<number>(
    existing?.kind === "expense" ? existing.payDay : Number(todayISO().slice(8, 10)),
  );

  // 경조사비 전용
  const [reason, setReason] = useState(
    existing?.kind === "gift" ? existing.reason : "",
  );

  const [saving, setSaving] = useState(false);

  const amountNum = Number(amount.replace(/[^0-9]/g, "")) || 0;
  const canSave =
    name.trim().length > 0 &&
    amountNum > 0 &&
    (isExpense ? true : reason.trim().length > 0);

  function handleSave() {
    if (!canSave || saving) return;
    setSaving(true);

    const now = Date.now();
    const base = {
      id: existing?.id ?? uid(),
      flow,
      name: name.trim(),
      amount: amountNum,
      date,
      memo: memo.trim() || undefined,
      photos,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    const record: Record = isExpense
      ? { ...base, kind: "expense", payMethod, payDay }
      : { ...base, kind: "gift", reason: reason.trim() };

    upsertRecord(record);
    onToast(isEdit ? "수정했어요" : "저장했어요");

    // ★ 저장 직후에는 광고를 넣지 않아요(핵심 액션 방해 방지).
    if (isEdit) {
      goBack();
    } else {
      navigate({ name: "detail", id: record.id });
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>
          {isEdit ? "기록 수정" : isExpense ? "고정지출 추가" : "경조사비 추가"}
        </h1>
        <div className="sub">
          {isExpense ? "매달 나가는 돈을 남겨요" : "누구와 · 언제 · 얼마를 남겨요"}
        </div>
      </div>

      <div className="page-body">
        {/* 방향(부호) 토글 - 탭별 문구 */}
        <div className="field">
          <label>{isExpense ? "지출인가요, 저축·투자인가요?" : "받았나요, 냈나요?"}</label>
          <div className="segment two">
            {(["out", "in"] as Flow[]).map((f) => (
              <button
                key={f}
                className={`seg ${flow === f ? `active dir-${f === "in" ? "received" : "given"}` : ""}`}
                onClick={() => setFlow(f)}
              >
                {isExpense
                  ? f === "out"
                    ? "💸 지출"
                    : "💰 저축·투자"
                  : f === "out"
                    ? "💸 냈어요"
                    : "🎁 받았어요"}
              </button>
            ))}
          </div>
        </div>

        {/* 이름 */}
        <div className="field">
          <label>{isExpense ? "무슨 항목인가요?" : "누구인가요?"}</label>
          <input
            className="text-input"
            placeholder={
              isExpense ? "예: 넷플릭스, 월세, 통신비" : "이름을 입력해요 (예: 김철수)"
            }
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* === 고정지출 전용: 결제방법 / 결제일 === */}
        {isExpense && (
          <>
            <div className="field">
              <label>결제방법</label>
              <div className="segment">
                {PAY_METHODS.map((p) => (
                  <button
                    key={p}
                    className={`seg ${payMethod === p ? "active" : ""}`}
                    onClick={() => setPayMethod(p)}
                  >
                    {PAY_METHOD_LABEL[p]}
                  </button>
                ))}
              </div>
            </div>

            <div className="field">
              <label>매달 결제일</label>
              <div className="amount-input">
                <span className="won" style={{ marginRight: 8 }}>매달</span>
                <input
                  inputMode="numeric"
                  placeholder="25"
                  value={payDay ? String(payDay) : ""}
                  onChange={(e) => {
                    const v = Number(e.target.value.replace(/[^0-9]/g, ""));
                    if (!v) return setPayDay(0);
                    setPayDay(Math.min(31, Math.max(1, v)));
                  }}
                  style={{ textAlign: "right" }}
                />
                <span className="won">일</span>
              </div>
            </div>
          </>
        )}

        {/* === 경조사비 전용: 사유 === */}
        {!isExpense && (
          <div className="field">
            <label>무슨 사유예요?</label>
            <input
              className="text-input"
              placeholder="예: 결혼, 돌잔치, 장례"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <div className="chips">
              {REASON_CHIPS.map((c) => (
                <button key={c} className="chip" onClick={() => setReason(c)}>
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}

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
          <label>{isExpense ? "언제부터인가요? (시작일)" : "언제였나요?"}</label>
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
        <div className="row-btns">
          <button
            className="btn btn-ghost"
            style={{ flex: "0 0 34%" }}
            onClick={() => goBack()}
          >
            취소
          </button>
          <button
            className="btn btn-primary btn-lg"
            style={{ flex: 1 }}
            disabled={!canSave || saving}
            onClick={handleSave}
          >
            {saving ? "저장하고 있어요…" : isEdit ? "수정 완료" : "저장하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
