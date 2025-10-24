// features/hub/tabs/AreaInfo/sections/MapCard.tsx
import { SectionTitle } from "@/components";

export function MapCard() {
  return (
    <div className="p-0">
      <SectionTitle title="離発着エリア（マップ）" />
      <div className="mt-4 h-[420px] w-full overflow-hidden">
        <iframe
          src="https://rc-rdsystem-dev-map.s3.ap-northeast-1.amazonaws.com/index.html"
          width="100%"
          height="100%"
          className="w-full h-full"
          style={{ border: "none" }}
          title="離発着エリア地図"
          loading="lazy"
        />
      </div>
    </div>
  );
}
