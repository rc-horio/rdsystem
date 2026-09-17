function formatProjectSchedule(projectName: string, scheduleName: string): string {
  const project = projectName.trim() || "この案件";
  const schedule = scheduleName.trim() || "このスケジュール";
  return `「${project} ${schedule}」`;
}

export function confirmHubVenueChange(params: {
  projectName: string;
  scheduleName: string;
  oldAreaName: string;
  newAreaName: string;
}): boolean {
  const subject = formatProjectSchedule(params.projectName, params.scheduleName);
  const oldArea = params.oldAreaName.trim() || "別のエリア";
  const newArea = params.newAreaName.trim();
  if (!newArea) {
    return window.confirm(
      `${subject}はすでに「${oldArea}」に紐づいています。\n開催地の紐づけを解除しますか？\n解除すると、元のエリアは解除されます。`
    );
  }
  return window.confirm(
    `${subject}はすでに「${oldArea}」に紐づいています。\n「${newArea}」に付け替えますか？\n付け替えると、元のエリアは解除されます。`
  );
}
