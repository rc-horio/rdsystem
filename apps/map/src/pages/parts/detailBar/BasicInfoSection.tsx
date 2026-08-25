import { useEffect, useState } from "react";
import { InputBox, SelectBox, Textarea } from "@/components";
import type { DetailMeta } from "@/features/types";
import { PREFECTURES } from "../constants/events";
import {
  hasValidLatLng,
  openGoogleMapsForCurrentPoint,
  requestCurrentPoint,
} from "./openGoogleMaps";

type Props = {
  title: string;
  onTitleChange: (value: string) => void;
  meta: DetailMeta;
  onMetaPatch: (patch: Partial<DetailMeta>) => void;
};

export function BasicInfoSection({
  title,
  onTitleChange,
  meta,
  onMetaPatch,
}: Props) {
  const [mapsAvailable, setMapsAvailable] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      requestCurrentPoint().then((point) => {
        if (!cancelled) setMapsAvailable(hasValidLatLng(point));
      });
    }, 350);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [title]);

  return (
    <section className="detailbar-basic" aria-label="基本情報">
      <div className="detailbar-area-title">
        <InputBox
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          aria-label="エリア名称"
        />
      </div>
      <div className="detailbar-form">
        <InputBox
          label="会社名"
          value={meta.companyName ?? ""}
          onChange={(e) => onMetaPatch({ companyName: e.target.value })}
        />
        <SelectBox
          label="都道府県"
          value={meta.prefecture}
          options={PREFECTURES}
          onChange={(e) => onMetaPatch({ prefecture: e.target.value })}
        />
        <InputBox
          label="担当者"
          value={meta.manager}
          onChange={(e) => onMetaPatch({ manager: e.target.value })}
        />
        <InputBox
          label="機体数目安"
          value={meta.aircraftCount}
          onChange={(e) => onMetaPatch({ aircraftCount: e.target.value })}
        />
        <InputBox
          label="制限高(海抜高)"
          value={meta.altitudeLimit}
          onChange={(e) => onMetaPatch({ altitudeLimit: e.target.value })}
        />
        <Textarea
          label="制限"
          rows={2}
          value={meta.restrictionsMemo}
          onChange={(e) => onMetaPatch({ restrictionsMemo: e.target.value })}
        />
        <Textarea
          label="備考"
          rows={2}
          value={meta.remarks}
          onChange={(e) => onMetaPatch({ remarks: e.target.value })}
        />
        <Textarea
          label="住所"
          rows={2}
          value={meta.address}
          onChange={(e) => onMetaPatch({ address: e.target.value })}
        />
        <div className="detailbar-gmaps-row">
          <button
            type="button"
            className="detailbar-gmaps-button"
            disabled={!mapsAvailable}
            onClick={() => {
              void openGoogleMapsForCurrentPoint().then((ok) => {
                if (!ok) setMapsAvailable(false);
              });
            }}
          >
            Google Mapを開く
          </button>
        </div>
      </div>
    </section>
  );
}
