const ROLE_OPTIONS = [
  {
    value: 'Member',
    label: 'Member',
    description: 'View your assigned work and update task progress.',
  },
  {
    value: 'Admin',
    label: 'Admin',
    description: 'Manage users, projects, and task assignments.',
  },
];

export default function AuthRolePicker({ value, onChange, label = 'Continue as' }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-1.5">{label}</label>
      <div className="grid grid-cols-2 gap-2">
        {ROLE_OPTIONS.map((option) => {
          const isActive = value === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`rounded-xl border px-4 py-3 text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                isActive
                  ? 'border-indigo-500 bg-indigo-600/15 shadow-lg shadow-indigo-950/30'
                  : 'border-slate-700 bg-slate-900/70 hover:border-slate-500 hover:bg-slate-800/80'
              }`}
            >
              <span className="block text-sm font-semibold text-slate-100">{option.label}</span>
              <span className="mt-1 block text-xs leading-5 text-slate-400">{option.description}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
