import { PageTransition } from "@/components/PageTransition";
import { VvPageHeader } from "@/components/vv/VvPageHeader";
import { AdminConversionPipelineClient } from "./_components/AdminConversionPipelineClient";

export default function AdminConversionPipelinePage() {
  return (
    <PageTransition>
      <VvPageHeader
        kicker="Operations"
        title="Conversion Pipeline"
        sub="Cadets converting a military or foreign license to CPL, ATPL, or PPL — from first contact through license issuance."
      />
      <AdminConversionPipelineClient />
    </PageTransition>
  );
}
