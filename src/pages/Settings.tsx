import PageHeader from "../components/PageHeader";
import RateSettings from "../components/RateSettings";
import RecurringSettings from "../components/RecurringSettings";

export default function Settings() {
  return (
    <div className="space-y-8">
      <PageHeader title="Ajustes" />
      <RateSettings />
      <hr className="border-line" />
      <RecurringSettings />
    </div>
  );
}
