// src/components/PageSpinner.jsx
// Consistent Suspense fallback used across all four dashboards.
// Replaces the mix of polished spinners, plain "Loading..." divs,
// and animated emoji that previously varied per role.

export default function PageSpinner() {
  return (
    <div className="flex items-center justify-center h-full min-h-[200px]">
      <div className="relative w-16 h-16">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    </div>
  );
}
