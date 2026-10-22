import { SectionTitle } from "@/components";

/** 関連情報。この段階では空の表示だけ */
export default function RelatedInfoTab() {
  return (
    <div>
      <SectionTitle title="リンク" />
      <p className="text-sm text-slate-400">リンクは登録されていません</p>
    </div>
  );
}
