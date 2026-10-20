import PageHeader from "../components/PageHeader";
import AppearanceSettings from "../components/AppearanceSettings";
import RateSettings from "../components/RateSettings";
import RecurringSettings from "../components/RecurringSettings";

export default function Settings() {
  return (
    <div className="space-y-8">
      <PageHeader title="Ajustes" />
      <AppearanceSettings />
      <hr className="border-line" />
      <RateSettings />
      <hr className="border-line" />
      <RecurringSettings />
    </div>
  );
}
