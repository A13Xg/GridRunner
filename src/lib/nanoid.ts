let counter = 0;
export function nanoid(): string {
  return `${Date.now()}-${++counter}`;
}
