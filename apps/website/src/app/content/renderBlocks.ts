import type { BlockSpec } from './blocks-registry';
import { blockLoaders } from './blocks-registry';

/**
 * Resolve CMS "blocks" into [Component, props] pairs.
 * Returns only components that successfully load.
 */
export async function renderBlocks(blocks: BlockSpec[] = []) {
  const out: Array<[any, Record<string, any>]> = [];
  for (const b of blocks) {
    try {
      const load = blockLoaders[b.type];
      if (!load) continue;
      const mod = await load();
      if (!mod?.default) continue;
      out.push([mod.default, { ...(b.props ?? {}) }]);
    } catch {
      // Skip failing block silently; the page must not crash
    }
  }
  return out;
}
