// 사진 첨부 (건당 1~3장 무료, 4장째부터 리워드 광고로 잠금해제).
//
// ★ 이탈/심사 배려:
//   - 리워드 광고가 미지원/실패/닫힘이어도 4장째 첨부를 열어줘요 (기능을 가두지 않음).
//   - 사진 첨부 화면 자체엔 배너/전면 광고를 넣지 않아요.
//
// 사진은 <input type=file>로 받고 base64 data URL로 로컬 저장해요.
// (토스 openCamera/fetchAlbumPhotos도 있지만, 심사 웹 환경 호환을 위해 파일 input 우선)

import { useRef, useState } from "react";
import type { PhotoAttachment } from "../types";
import { uid } from "../utils";
import { AD_GROUP_IDS } from "../ads/adConfig";
import { showRewarded } from "../ads/fullScreenAd";

const FREE_LIMIT = 3;
const HARD_LIMIT = 6; // 리워드 해제 후에도 최대 장수 (성능/저장 보호)

interface Props {
  photos: PhotoAttachment[];
  onChange: (photos: PhotoAttachment[]) => void;
  onToast: (msg: string) => void;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function PhotoAttach({ photos, onChange, onToast }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [busy, setBusy] = useState(false);

  const atFreeLimit = photos.length >= FREE_LIMIT;
  const needUnlock = atFreeLimit && !unlocked;
  const atHardLimit = photos.length >= HARD_LIMIT;

  async function handleAddClick() {
    if (atHardLimit) {
      onToast(`사진은 최대 ${HARD_LIMIT}장까지 첨부할 수 있어요`);
      return;
    }

    // 4장째부터: 리워드 광고 (실패해도 열어줌)
    if (needUnlock) {
      setBusy(true);
      const result = await showRewarded(AD_GROUP_IDS.rewarded);
      setBusy(false);
      setUnlocked(true); // ★ 어떤 결과든 잠금 해제 (기능을 가두지 않음)
      if (result === "rewarded") {
        onToast("오늘은 사진을 더 첨부할 수 있어요!");
      }
    }
    inputRef.current?.click();
  }

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = ""; // 같은 파일 재선택 허용
    if (files.length === 0) return;

    const room = HARD_LIMIT - photos.length;
    const picked = files.slice(0, room);
    const added: PhotoAttachment[] = [];
    for (const f of picked) {
      try {
        const dataUrl = await fileToDataUrl(f);
        added.push({ id: uid(), dataUrl });
      } catch {
        // 개별 실패는 건너뜀
      }
    }
    if (added.length > 0) {
      onChange([...photos, ...added]);
    }
  }

  function removePhoto(id: string) {
    onChange(photos.filter((p) => p.id !== id));
  }

  return (
    <div>
      <div className="photo-grid">
        {photos.map((p) => (
          <div className="photo-thumb" key={p.id}>
            <img src={p.dataUrl} alt="첨부 사진" />
            <button
              className="remove"
              onClick={() => removePhoto(p.id)}
              aria-label="삭제"
            >
              ×
            </button>
          </div>
        ))}

        {!atHardLimit && (
          <button
            className={`photo-add ${needUnlock ? "locked" : ""}`}
            onClick={handleAddClick}
            disabled={busy}
          >
            <span className="plus">+</span>
            <span>
              {busy
                ? "잠깐만요…"
                : needUnlock
                  ? "광고 보고\n더 담기"
                  : "사진 담기"}
            </span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: "none" }}
        onChange={handleFiles}
      />

      {needUnlock && (
        <p
          style={{
            marginTop: 8,
            fontSize: 12.5,
            color: "var(--text-sub)",
            lineHeight: 1.5,
          }}
        >
          사진은 3장까지 그냥 담을 수 있어요. 더 담고 싶다면 짧은 광고만
          보면 돼요 🙂
        </p>
      )}
    </div>
  );
}
