import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  action?: ReactNode;
}

// Consistent page title row (with optional action button on the right).
export default function PageHeader({ title, action }: PageHeaderProps) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h1 className="text-xl font-bold sm:text-2xl">{title}</h1>
      {action}
    </div>
  );
}
