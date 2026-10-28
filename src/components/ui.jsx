/* Small shared UI building blocks styled with Tailwind utilities. */
const base = 'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:pointer-events-none select-none';
const variants = {
  default: 'border border-line bg-surface2 text-fg hover:border-primary-text',
  primary: 'bg-primary text-primary-ink hover:bg-primary-hover shadow-sm',
  danger: 'bg-wrong text-white hover:brightness-110',
  ghost: 'text-dim hover:bg-surface2 hover:text-fg',
  accent: 'bg-accent text-bg hover:brightness-110',
};
const sizes = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2.5 text-sm', lg: 'px-6 py-3 text-base' };

export function btnClass(variant = 'default', size = 'md', extra = '') {
  return [base, variants[variant], sizes[size], extra].filter(Boolean).join(' ');
}

export function Button({ variant = 'default', size = 'md', className = '', type = 'button', ...rest }) {
  return <button type={type} className={btnClass(variant, size, className)} {...rest} />;
}

export function Card({ className = '', as: Tag = 'section', ...rest }) {
  return <Tag className={'rounded-2xl border border-line bg-surface p-4 shadow-card sm:p-5 ' + className} {...rest} />;
}

export function PageHead({ title, subtitle, children }) {
  return (
    <div className="mb-6 motion-safe:animate-rise">
      <h1 className="mb-1 text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
      {subtitle ? <p className="max-w-3xl text-dim">{subtitle}</p> : null}
      {children}
    </div>
  );
}

export function SectionTitle({ children, id }) {
  return <h2 id={id} className="mb-3 mt-8 text-lg font-bold">{children}</h2>;
}

export function Chip({ pressed, className = '', ...rest }) {
  return (
    <button
      type="button" aria-pressed={pressed}
      className={'rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors ' + (pressed ? 'border-primary bg-primary text-primary-ink' : 'border-line bg-surface2 text-dim hover:border-primary-text hover:text-fg') + ' ' + className}
      {...rest}
    />
  );
}

export function Switch({ checked, onChange, label }) {
  return (
    <button
      type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}
      className={'relative h-7 w-12 shrink-0 rounded-full border transition-colors ' + (checked ? 'border-primary bg-primary' : 'border-line bg-surface2')}
    >
      <span className={'absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ' + (checked ? 'start-6' : 'start-0.5')} />
    </button>
  );
}

export function Stat({ value, label }) {
  return (
    <div className="rounded-xl bg-surface2 px-4 py-3">
      <b className="block text-2xl tabular-nums">{value}</b>
      <span className="text-xs text-dim">{label}</span>
    </div>
  );
}
