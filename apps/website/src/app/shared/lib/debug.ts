export function debug(...args: any[]) {
  if (import.meta.env.DEV) console.log(...args);
}
