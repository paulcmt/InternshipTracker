import { PageHeader } from "@/components/layout/page-header";
import { PageLayout } from "@/components/layout/page-layout";
import { CompanyForm } from "@/components/forms/company-form";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function NewCompanyPage() {
  return (
    <PageLayout>
      <div className="flex flex-1 flex-col gap-6 p-6">
        <PageHeader
          title="Nouvelle entreprise"
          description="Ajouter une entreprise à votre suivi"
        />
        <Card>
          <CardHeader />
          <CardContent>
            <CompanyForm />
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
