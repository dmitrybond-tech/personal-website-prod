export const CAL_ENV = {
  USERNAME: import.meta.env.PUBLIC_CAL_USERNAME as string,
  BASE: import.meta.env.PUBLIC_CAL_EMBED_LINK as string,
  EVENTS: (import.meta.env.PUBLIC_CAL_EVENTS as string) || ''
};

export type EnvEvent = { slug: string; label: string };

export function parseEnvEvents(s: string): EnvEvent[] {
  return s
    .split(',')
    .map(x => x.trim())
    .filter(Boolean)
    .map(pair => {
      const [slug, label] = pair.split('|').map(y => (y ?? '').trim());
      return slug ? { slug, label: label || slug } : null;
    })
    .filter(Boolean) as EnvEvent[];
}

export function makeCalLink(username: string, slug: string) {
  // Cal inline embed accepts "username/event-type" as calLink
  return `${username}/${slug}`;
}
