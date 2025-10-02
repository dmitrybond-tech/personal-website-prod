// Ambient type declarations for third-party modules

declare module 'iconify-icon-names' {
  export type Fa6Brands = string;
  export type Fa6Solid = string;
  export type SimpleIcons = string;
  export type CircleFlags = string;
  export type Ri = string;
}

declare module 'vitest' {
  export const describe: any;
  export const it: any;
  export const expect: any;
  export const beforeEach: any;
  export const afterEach: any;
}

// Global Cal.com types
declare global {
  interface Window {
    Cal?: {
      (command: string, ...args: any[]): void;
      ns?: Record<string, any>;
      loaded?: boolean;
    };
  }
  
  const Cal: {
    (command: string, ...args: any[]): void;
    ns?: Record<string, any>;
    loaded?: boolean;
  };
}

export {};
