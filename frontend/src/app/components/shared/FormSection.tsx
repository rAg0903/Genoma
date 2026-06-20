import { ReactNode } from 'react';

type FormSectionProps = {
  title: string;
  children: ReactNode;
};

export function FormSection({ title, children }: FormSectionProps) {
  return (
    <section>
      <h3 className="mb-3 pb-2 border-b border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider">
        {title}
      </h3>
      {children}
    </section>
  );
}
