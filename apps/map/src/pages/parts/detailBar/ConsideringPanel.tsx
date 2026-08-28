import { InputBox, SelectBox, Textarea } from "@/components";
import type { ConsideringInfo } from "@/features/types";
import {
  CONSIDERING_CHANNEL_FREE_LABEL,
  CONSIDERING_CHANNEL_PRESETS,
  CONSIDERING_STATUS_PRESETS,
  CONSIDERING_STATUS_UNSET_LABEL,
  isPresetConsideringChannel,
  isPresetConsideringStatus,
  needsConsideringStatusDetail,
} from "./helpers";

type Props = {
  considering: ConsideringInfo;
  onConsideringPatch: (patch: Partial<ConsideringInfo>) => void;
};

export function ConsideringPanel({
  considering,
  onConsideringPatch,
}: Props) {
  const channelSelectValue = isPresetConsideringChannel(considering.channel)
    ? considering.channel
    : CONSIDERING_CHANNEL_FREE_LABEL;
  const statusSelectValue = isPresetConsideringStatus(considering.status)
    ? considering.status
    : "";

  return (
    <section className="considering-panel" role="tabpanel" aria-label="候補">
      <div className="detailbar-form">
        <div className="detailbar-form-group">
          <InputBox
            label="担当者"
            value={considering.manager}
            onChange={(e) => onConsideringPatch({ manager: e.target.value })}
          />
          <SelectBox
            label="ステータス"
            value={statusSelectValue}
            options={[
              { value: "", label: CONSIDERING_STATUS_UNSET_LABEL },
              ...CONSIDERING_STATUS_PRESETS,
            ]}
            onChange={(e) => onConsideringPatch({ status: e.target.value })}
          />
          {needsConsideringStatusDetail(considering.status) && (
            <Textarea
              label="ステータス詳細"
              rows={2}
              value={considering.statusDetail}
              onChange={(e) =>
                onConsideringPatch({ statusDetail: e.target.value })
              }
            />
          )}
          <SelectBox
            label="チャネル"
            value={channelSelectValue}
            options={[
              ...CONSIDERING_CHANNEL_PRESETS,
              CONSIDERING_CHANNEL_FREE_LABEL,
            ]}
            onChange={(e) => {
              const next = e.target.value;
              if (next === CONSIDERING_CHANNEL_FREE_LABEL) {
                onConsideringPatch({
                  channel: isPresetConsideringChannel(considering.channel)
                    ? ""
                    : considering.channel,
                });
                return;
              }
              onConsideringPatch({ channel: next });
            }}
          />
          {!isPresetConsideringChannel(considering.channel) && (
            <InputBox
              className="other-record-company-free"
              value={considering.channel}
              onChange={(e) => onConsideringPatch({ channel: e.target.value })}
              aria-label="チャネル（その他）"
            />
          )}
          <InputBox
            label="フィジビリティ"
            value={considering.feasibility}
            onChange={(e) =>
              onConsideringPatch({ feasibility: e.target.value })
            }
          />
          <InputBox
            label="コスト目安"
            value={considering.costEstimate}
            onChange={(e) =>
              onConsideringPatch({ costEstimate: e.target.value })
            }
          />
          <Textarea
            label="メモ"
            rows={2}
            value={considering.memo}
            onChange={(e) => onConsideringPatch({ memo: e.target.value })}
          />
        </div>
      </div>
    </section>
  );
}
