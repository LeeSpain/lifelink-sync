/**
 * Standard admin page layout classes.
 * Import from here to ensure all admin pages look identical.
 */
export const ADMIN_PAGE = {
  wrapper: "p-6 max-w-7xl mx-auto w-full",
  header: "flex items-start justify-between mb-6",
  title: "text-2xl font-bold text-gray-900",
  subtitle: "text-gray-400 text-sm mt-0.5",
  statsGrid: "grid gap-4 mb-6",
  statCard: "bg-white border border-gray-200 rounded-2xl p-4",
  statLabel: "text-xs font-semibold uppercase tracking-widest text-gray-400 leading-tight",
  statValue: "text-2xl font-bold text-gray-900 mt-2",
  card: "bg-white border border-gray-200 rounded-2xl",
  cardPadded: "bg-white border border-gray-200 rounded-2xl p-5",
} as const;
