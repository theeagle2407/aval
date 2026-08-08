import { RequireWallet } from "../components/RequireWallet";
import { PlaceholderView } from "../components/PlaceholderView";

export default function AuditPage() {
  return (
    <RequireWallet>
      <PlaceholderView title="Audit" note="Wired up in step 4." />
    </RequireWallet>
  );
}
