import type { OperationModuleKind } from "@/features/hub/types/resource";

/** オペレーションタブで登録可能なモジュール種類数の上限 */
export const OPERATION_MAX_MODULES = 20;

export const OPERATION_MODULE_KIND_OPTIONS: {
  value: OperationModuleKind;
  label: string;
}[] = [
  { value: "flash", label: "フラッシュ" },
  { value: "fireworks", label: "花火" },
];

export function parseOperationModuleKind(
  value: unknown
): OperationModuleKind | undefined {
  return value === "flash" || value === "fireworks" ? value : undefined;
}

export function operationModuleKindLabel(
  kind: OperationModuleKind | undefined
): string {
  if (kind === "flash") return "フラッシュ";
  if (kind === "fireworks") return "花火";
  return "未設定";
}
