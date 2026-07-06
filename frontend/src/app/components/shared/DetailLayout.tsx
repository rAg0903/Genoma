import type { LucideIcon } from 'lucide-react';
import { DETAIL, FORM, FormFieldWidth } from '../../../lib/design-tokens';

export function DetailPanel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`${DETAIL.panel} ${className}`}>{children}</div>;
}

export function DetailSection({ title, icon: Icon, children }: { title: string; icon: LucideIcon; children: React.ReactNode }) {
  return (
    <div className={DETAIL.section}>
      <div className={DETAIL.sectionTitle}>
        <span className={DETAIL.sectionIconBadge}>
          <Icon className={DETAIL.sectionIcon} />
        </span>
        <span>{title}</span>
      </div>
      {children}
    </div>
  );
}

export function DetailDivider() {
  return <div className={DETAIL.divider} role="separator" />;
}

export function InfoField({
  label,
  value,
  mono,
  width,
}: {
  label: string;
  value: string;
  mono?: boolean;
  width?: FormFieldWidth;
}) {
  const empty = !value || value === '—';
  return (
    <div className={width ? FORM.fieldWidth[width] : undefined}>
      <div className={DETAIL.labelArea}>
        <div className={DETAIL.label}>{label}</div>
      </div>
      <div
        className={[DETAIL.value, empty ? DETAIL.valueEmpty : ''].join(' ')}
        style={{ fontFamily: mono ? 'monospace' : undefined }}
      >
        {value || '—'}
      </div>
    </div>
  );
}

export function Section({ title, icon: Icon, children }: { title: string; icon: LucideIcon; children: React.ReactNode }) {
  return (
    <div className={DETAIL.card}>
      <div className={DETAIL.sectionTitle}>
        <span className={DETAIL.sectionIconBadge}>
          <Icon className={DETAIL.sectionIcon} />
        </span>
        <span>{title}</span>
      </div>
      {children}
    </div>
  );
}
