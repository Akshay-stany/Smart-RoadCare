import AppShell from "@/components/layout/AppShell";
import PageHeader from "@/components/common/PageHeader";
import ReportForm from "@/components/ReportForm";

export default function ReportPage() {
  return (
    <AppShell>
      <PageHeader
        title="Report a Road Issue"
        description="Help us identify and fix road problems in your area"
      />
      <ReportForm />
    </AppShell>
  );
}
