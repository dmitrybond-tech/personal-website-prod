import type { Skill } from '../../types/shared';
import type { Merge } from 'type-fest';

type SkillWithoutLevel = Omit<Skill, 'level'>;
type PartialSkillWithLevel = Partial<Skill> & { level?: number };

const createSkillFactory =
  <SkillData extends SkillWithoutLevel>(defaultData: Readonly<SkillData>) =>
  <Override extends PartialSkillWithLevel>(override: Readonly<Override>) =>
    ({
      ...defaultData,
      ...override,
    } as Readonly<Merge<SkillData, Override>>);

export default createSkillFactory;
