export function readScheduleAreaUuid(area: unknown): string {
  if (!area || typeof area !== "object") return "";
  const uuid = (area as { area_uuid?: unknown }).area_uuid;
  return typeof uuid === "string" ? uuid.trim() : "";
}

export function readScheduleAreaName(area: unknown): string {
  if (!area || typeof area !== "object") return "";
  const name = (area as { area_name?: unknown }).area_name;
  return typeof name === "string" ? name.trim() : "";
}

function formatProjectSchedule(projectName: string, scheduleName: string): string {
  const project = projectName.trim() || "この案件";
  const schedule = scheduleName.trim() || "このスケジュール";
  return `「${project} ${schedule}」`;
}

export function confirmScheduleAreaRelink(params: {
  projectName: string;
  scheduleName: string;
  oldAreaName: string;
  newAreaName: string;
}): boolean {
  const subject = formatProjectSchedule(params.projectName, params.scheduleName);
  const oldArea = params.oldAreaName.trim() || "別のエリア";
  const newArea = params.newAreaName.trim() || "このエリア";
  return window.confirm(
    `${subject}はすでに「${oldArea}」に紐づいています。\n「${newArea}」に付け替えますか？\n付け替えると、元のエリアは解除されます。`
  );
}
