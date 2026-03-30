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

// 複数ブロック対応（Phase 1）
export type Block = {
  id: string; // UUID (RFC 4122)
  x_count: number;
  y_count: number;
  count: number;
};

export type BlockLayoutRow = {
  block_ids: string[];
  gaps_m: number[];
};

export type BlockLayout = {
  rows: BlockLayoutRow[];
  gaps_between_rows_m: number[];
};

export type Placement = {
  block_id: string;
  x: number;
  y: number;
  spacing_m: number;
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
  distance_from_viewers_m: number | null;
  spacing_between_drones_m: {
    horizontal: string; // "0.6 1.2" のようにスペース区切り
    vertical: string;
  };
  /** 複数ブロック時のみ。無い or 空の場合は drone_count を参照して 1 ブロックとして扱う */
  blocks?: Block[];
  /** 複数ブロック時の行ごとの配置・間隔 */
  block_layout?: BlockLayout;
  /** 離発着エリア図の表示設定（四隅番号・メモリ位置調整） */
  landing_figure_display?: {
    show_corner_numbers?: boolean;
    show_block_labels?: boolean;
    show_ruler?: boolean;
    corner_by_block_id?: Record<
      string,
      {
        fontSize?: number;
        placement?: "inside" | "outside";
        outsideHorizontal?: boolean;
        outsideVertical?: boolean;
      }
    >;
    ruler?: {
      leftXOffsetPx?: number;
      bottomYOffsetPx?: number;
    };
  };
};

export type Operation = {
  placement: {
    x: number | null;
    y: number | null;
    spacing_m: number | null;
  };
  /** 複数ブロック時のみ。1 ブロック時は placement をそのまま使用 */
  placements?: Placement[];
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
