import { format } from 'date-fns';
import type { DateRange } from '../../types/shared';

// Простая реализация без зависимости от config
const formatDateRange = ([from, to]: DateRange): string => {
  const fromStr = format(from, 'MMM yyyy');
  const toStr = to ? format(to, 'MMM yyyy') : 'Present';
  return `${fromStr} - ${toStr}`;
};

export default formatDateRange;