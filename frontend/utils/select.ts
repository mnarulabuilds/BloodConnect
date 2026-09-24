import type { SelectOption } from '@/components/SearchableSelect';

export function filterSelectOptions<T>(options: SelectOption<T>[], query: string): SelectOption<T>[] {
  const q = query.trim().toLowerCase();
  if (!q) return options;
  return options.filter(
    (option) =>
      option.label.toLowerCase().includes(q) ||
      (option.sublabel?.toLowerCase().includes(q) ?? false)
  );
}
