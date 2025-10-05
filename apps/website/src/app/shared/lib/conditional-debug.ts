/**
 * Conditional debug utility for production builds
 * Automatically disables debug output in production
 */

const isDev = import.meta.env.DEV;

export function debug(message: string, ...args: any[]) {
  if (isDev) {
    console.debug(message, ...args);
  }
}

export function warn(message: string, ...args: any[]) {
  if (isDev) {
    console.warn(message, ...args);
  }
}

export function log(message: string, ...args: any[]) {
  if (isDev) {
    console.log(message, ...args);
  }
}
