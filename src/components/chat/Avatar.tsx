interface Props {
  name: string;
  size?: number;
  online?: boolean;
}

// Deterministic gradient from username for avatar
const GRADIENTS = [
  'from-violet-500 to-fuchsia-500',
  'from-indigo-500 to-purple-500',
  'from-pink-500 to-rose-500',
  'from-sky-500 to-indigo-500',
  'from-emerald-500 to-teal-500',
  'from-amber-500 to-orange-500',
  'from-cyan-500 to-blue-500',
  'from-purple-500 to-pink-500',
];

function gradientFor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return GRADIENTS[h % GRADIENTS.length];
}

export function Avatar({ name, size = 40, online }: Props) {
  const initials = name
    .split(/[\s_]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(s => s[0]?.toUpperCase())
    .join('') || '?';
  const grad = gradientFor(name);
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div
        className={`bg-gradient-to-br ${grad} rounded-full flex items-center justify-center font-semibold text-white shadow-soft ring-2 ring-telegraph-bg/40`}
        style={{ width: size, height: size, fontSize: size * 0.38 }}
      >
        {initials}
      </div>
      {online && (
        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-telegraph-online ring-2 ring-telegraph-bg" />
      )}
    </div>
  );
}
