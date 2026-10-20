import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: "default" | "success" | "danger";
}

// Summary card on the dashboard (balance / income / expense).
export default function StatCard({ label, value, icon: Icon, tone = "default" }: StatCardProps) {
  const toneClasses = {
    default: "text-primary",
    success: "text-success",
    danger: "text-danger",
  }[tone];

  return (
    <div className="rounded-xl border border-line bg-card p-4 shadow-sm sm:p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted">{label}</span>
        <Icon size={18} className={toneClasses} />
      </div>
      <p className="mt-2 text-xl font-bold sm:text-2xl">{value}</p>
    </div>
  );
}
