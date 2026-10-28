/* LineChart - small accessible SVG line chart (no chart library needed). */
export default function LineChart({ values, max, min = 0, label, color = 'var(--color-primary-text)', format = (v) => v, height = 150 }) {
  const w = 600; const h = height; const pad = 24;
  const hi = max != null ? max : Math.max(1, ...values) * 1.1;
  const x = (i) => pad + (values.length === 1 ? (w - 2 * pad) / 2 : (i * (w - 2 * pad)) / (values.length - 1));
  const y = (v) => h - pad - ((Math.min(Math.max(v, min), hi) - min) / (hi - min || 1)) * (h - 2 * pad);
  const pts = values.map((v, i) => x(i) + ',' + y(v)).join(' ');
  return (
    <svg viewBox={'0 0 ' + w + ' ' + h} role="img" aria-label={label} className="h-auto w-full" dir="ltr">
      {[0, 0.5, 1].map((f) => { const yy = h - pad - f * (h - 2 * pad); return <g key={f}><line x1={pad} x2={w - pad} y1={yy} y2={yy} stroke="var(--color-line)" strokeDasharray="3 4" /><text x={pad - 4} y={yy + 4} fontSize="11" textAnchor="end" fill="var(--color-faint)">{format(Math.round(min + f * (hi - min)))}</text></g>; })}
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {values.map((v, i) => <circle key={i} cx={x(i)} cy={y(v)} r="3.5" fill={color}><title>{format(v)}</title></circle>)}
    </svg>
  );
}
