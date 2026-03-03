export function parseCSV(str: string): string[][] {
  return str
    .split("\n")
    .map((line) => line.trim())
    .map((line) => line.split(","));
}
