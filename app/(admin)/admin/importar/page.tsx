import { getPendingOutreachCount } from "@/lib/admin/outreach";
import ImportarClient from "@/components/admin/ImportarClient";

export const dynamic = "force-dynamic";

export default async function ImportarPage() {
  const count = await getPendingOutreachCount();
  return <ImportarClient initialPendingCount={count} />;
}
