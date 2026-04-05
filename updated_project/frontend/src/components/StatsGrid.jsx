// src/components/StatsGrid.jsx
// Shared presentational component for stat-card grids used by both
// the Owner Reports page and the Admin Reports page.
// FIX: previously each page duplicated the same card layout independently.

/**
 * @param {{ cards: Array<{ label: string, value: string|number|null, color: string }> }} props
 * `value` of null renders as "—" to indicate the data couldn't be loaded,
 * which is honest and prevents misleading zeroes.
 */
export default function StatsGrid({ cards }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {cards.map(card => (
        <div
          key={card.label}
          className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow border border-gray-200 dark:border-gray-700"
        >
          <h3 className="font-bold text-gray-700 dark:text-gray-300">{card.label}</h3>
          <p className={`text-2xl font-semibold mt-1 ${card.color}`}>
            {card.value ?? '—'}
          </p>
        </div>
      ))}
    </div>
  );
}
