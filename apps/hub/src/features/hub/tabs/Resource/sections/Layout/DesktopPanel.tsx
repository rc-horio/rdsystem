// src/features/hub/tabs/Resource/sections/Layout/DesktopPanel.tsx
import { PeopleSection } from "../PeopleSection";
import { HotelSection } from "../HotelSection";
import { DroneSection } from "../DroneSection";
import { VehicleSection } from "../VehicleSection";
import { OthersSection } from "../OthersSection";
import type { ScheduleDetail } from "@/features/hub/types/resource";
import { BatterySection } from "../BatterySection";
import { ModuleSection } from "../ModuleSection";

export function DesktopThreePane({
  current,
  edit,
  updateSchedule,
}: {
  current: ScheduleDetail | null;
  edit: boolean;
  setEdit: (b: boolean) => void;
  updateSchedule: (id: string, updates: Partial<ScheduleDetail>) => void;
  onSave: () => void;
  isSaving: boolean;
}) {
  return (
    <div className="hidden md:grid md:grid-cols-12 gap-6">
      {/* 左カラム */}
      <div className="md:col-span-6 space-y-6">
        {current ? (
          <>
            <PeopleSection
              key={`people-${current.id}`}
              edit={edit}
              people={current.resource.people}
              onChange={(people) =>
                updateSchedule(current.id, {
                  resource: { ...current.resource, people },
                })
              }
            />
            <VehicleSection
              key={`vehicle-${current.id}`}
              edit={edit}
              vehicles={current.resource.vehicles}
              onChange={(vehicles) =>
                updateSchedule(current.id, {
                  resource: { ...current.resource, vehicles },
                })
              }
            />

            <HotelSection
              key={`hotel-${current.id}`}
              edit={edit}
              hotels={current.resource.hotels}
              onChange={(hotels) =>
                updateSchedule(current.id, {
                  resource: { ...current.resource, hotels },
                })
              }
            />
          </>
        ) : (
          <div className="text-slate-400">スケジュールを選択/作成してください</div>
        )}
      </div>

      {/* 右カラム */}
      <div className="md:col-span-6 space-y-6">
        {current ? (
          <>
            <DroneSection
              key={`drone-${current.id}`}
              edit={edit}
              drones={current.resource.drones}
              onChange={(drones) =>
                updateSchedule(current.id, {
                  resource: { ...current.resource, drones },
                })
              }
            />
            <BatterySection
              key={`battery-${current.id}`}
              edit={edit}
              battery={current.resource.batteries ?? []}
              onChange={(batteries) =>
                updateSchedule(current.id, {
                  resource: { ...current.resource, batteries },
                })
              }
            />
            <ModuleSection
              key={`module-${current.id}`}
              edit={edit}
              modules={current.resource.modules ?? []}
              onChange={(modules) =>
                updateSchedule(current.id, {
                  resource: { ...current.resource, modules },
                })
              }
            />
            <OthersSection
              key={`others-${current.id}`}
              edit={edit}
              items={current.resource.items}
              onChange={(items) =>
                updateSchedule(current.id, {
                  resource: { ...current.resource, items },
                })
              }
            />
          </>
        ) : null}
      </div>
    </div>
  );
}
