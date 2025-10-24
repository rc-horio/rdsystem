// src/features/hub/tabs/Resource/sections/Layout/MobilePanel.tsx
import { useMemo } from "react";
import { PeopleSection } from "../PeopleSection";
import { HotelSection } from "../HotelSection";
import { DroneSection } from "../DroneSection";
import { VehicleSection } from "../VehicleSection";
import { OthersSection } from "../OthersSection";
import type { ScheduleDetail } from "@/features/hub/types/resource";
import { BatterySection } from "../BatterySection";
import { ModuleSection } from "../ModuleSection";

export function MobileAccordion({
  schedules,
  edit,
  selectedId,
  updateSchedule,
}: {
  schedules: ScheduleDetail[];
  edit: boolean;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  updateSchedule: (id: string, updates: Partial<ScheduleDetail>) => void;
  setSchedules: React.Dispatch<React.SetStateAction<ScheduleDetail[]>>;
}) {
  const current = useMemo(() => {
    if (!schedules?.length) return null;
    const found = schedules.find((s) => s.id === selectedId);
    return found ?? schedules[0];
  }, [schedules, selectedId]);

  if (!current) {
    return (
      <div className="md:hidden text-slate-400">スケジュールがありません</div>
    );
  }

  return (
    <div className="space-y-4 md:hidden">
      {/* ── 選択中スケジュールの内容 ── */}
      <div className="p-4 space-y-4">
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
      </div>
    </div>
  );
}
