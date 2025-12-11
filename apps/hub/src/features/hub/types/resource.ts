export type Drone = {
  model: string;
  color: string;
  count: number;
};

export type Battery = {
  model: string;
  count: number;
};

export type Module = {
  type: string;
  count: number;
};

export type VehicleRow = {
  type: string;
  driver: string;
};

export type Vehicle = {
  rows: VehicleRow[];
  memo: string;
};

export type Item = {
  id: string;
  name: string;
  qty: number;
};

export type Hotel = {
  name: string;
  memo: string;
};

export type Person = {
  name?: string;
  role: string;
  memo: string;
  count?: number;
};

export type PeopleGroup = {
  group: string;
  people: Person[];
};

export type Resource = {
  drones: Drone[];
  batteries: Battery[];
  modules: Module[];
  vehicles: Vehicle;
  items: Item[];
  hotels: Hotel[];
  people: { groups: PeopleGroup[]; memo: string };
};

export type Area = {
  area_name: string;
  drone_count: {
    model: string;
    count: number;
  };
  // flight_area: {
  //   altitude_min_m: number | null;
  //   altitude_max_m: number | null;
  //   safety_area_m: number | null;
  // };
  actions: {
    liftoff: string;
    turn: string;
  };
  obstacle_note: string;
  lights: {
    takeoff: string;
    landing: string;
  };
  return_note: string;
  animation_area: {
    width_m: number | null;
    depth_m: number | null;
  };
  distance_from_viewers_m: number | null;
  spacing_between_drones_m: {
    horizontal: string; // "0.6 1.2" のようにスペース区切り
    vertical: string;
  };
};

export type Operation = {
  placement: {
    x: number | null;
    y: number | null;
    spacing_m: number | null;
  };
  modules: {
    name: string;
    ids: number[];
  }[];
  measurement: {
    target_id: string | null;
    result: string | null;
  };
  memo: string;
};

export interface PhotoItem {
  url: string;
  caption?: string;
  key?: string;
}

export interface ScheduleDetail {
  id: string;
  label: string;
  date: string;
  place: string;
  resource: Resource;
  area?: any;
  operation?: any;
  photos?: PhotoItem[];
}
