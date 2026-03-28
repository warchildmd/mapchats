'use client'

import { cn } from '@/lib/utils'

export type FilterOption = 'all' | 'ALERT' | 'DISCUSSION' | 'EVENT'

interface FilterChipsProps {
  active: FilterOption
  onChange: (filter: FilterOption) => void
}

const filters: { value: FilterOption; label: string; color: string }[] = [
  { value: 'all', label: 'All', color: 'text-on-surface' },
  { value: 'ALERT', label: 'Alerts', color: 'text-secondary' },
  { value: 'DISCUSSION', label: 'Discussions', color: 'text-primary' },
  { value: 'EVENT', label: 'Events', color: 'text-tertiary' },
]

export default function FilterChips({ active, onChange }: FilterChipsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide py-1">
      {filters.map((f) => (
        <button
          key={f.value}
          onClick={() => onChange(f.value)}
          className={cn(
            'flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-150',
            active === f.value
              ? 'bg-primary text-surface font-semibold'
              : 'bg-surface-high text-on-surface-variant hover:bg-surface-highest hover:text-on-surface'
          )}
        >
          {f.label}
        </button>
      ))}
    </div>
  )
}
