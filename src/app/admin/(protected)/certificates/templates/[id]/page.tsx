import { getCertTemplateById } from "@/app/actions/cert-template";
import { notFound } from "next/navigation";
import { CertTemplateEditor } from "../components/CertTemplateEditor";

export const dynamic = "force-dynamic";

export default async function EditCertTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { success, template } = await getCertTemplateById(id);

  if (!success || !template) {
    notFound();
  }

  return <CertTemplateEditor initialTemplate={template as any} />;
}
