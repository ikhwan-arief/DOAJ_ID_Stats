/**
 * Developed by Ikhwan Arief (ikhwan[at]unand.ac.id).
 * Copyright (c) 2026 Ikhwan Arief. Copyright held by the application developer.
 */
import { useMemo, useState } from 'react';

export type SortDirection = 'asc' | 'desc';
type SortValue = string | number | boolean | null | undefined;

export function useSortableData<T>(
  items: T[],
  accessors: Record<string, (item: T) => SortValue>,
  defaultKey: string,
  defaultDirection: SortDirection = 'asc',
) {
  const [sortKey, setSortKey] = useState<string>(defaultKey);
  const [direction, setDirection] = useState<SortDirection>(defaultDirection);

  const sortedItems = useMemo(() => {
    const accessor = accessors[sortKey];
    return [...items].sort((left, right) => {
      const a = accessor(left);
      const b = accessor(right);
      if (a == null || a === '') return b == null || b === '' ? 0 : 1;
      if (b == null || b === '') return -1;
      const result = typeof a === 'number' && typeof b === 'number'
        ? a - b
        : String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
      return direction === 'asc' ? result : -result;
    });
  }, [items, accessors, sortKey, direction]);

  const requestSort = (key: string) => {
    if (key === sortKey) {
      setDirection((current) => current === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setDirection('asc');
    }
  };

  return { sortedItems, sortKey, direction, requestSort };
}

interface SortableHeaderProps {
  columnKey: string;
  label: string;
  activeKey: string;
  direction: SortDirection;
  onSort: (key: string) => void;
  align?: 'left' | 'center' | 'right';
}

export function SortableHeader({
  columnKey,
  label,
  activeKey,
  direction,
  onSort,
  align = 'left',
}: SortableHeaderProps) {
  const active = columnKey === activeKey;
  return (
    <th aria-sort={active ? (direction === 'asc' ? 'ascending' : 'descending') : 'none'} style={{ padding: 'var(--space-3)', textAlign: align }}>
      <button
        type="button"
        onClick={() => onSort(columnKey)}
        style={{
          appearance: 'none',
          background: 'none',
          border: 0,
          color: 'inherit',
          cursor: 'pointer',
          font: 'inherit',
          fontWeight: 700,
          minHeight: '44px',
          padding: 0,
          textAlign: align,
          width: '100%',
        }}
        title={`Sort by ${label}`}
      >
        {label} <span aria-hidden="true">{active ? (direction === 'asc' ? '▲' : '▼') : '↕'}</span>
      </button>
    </th>
  );
}
