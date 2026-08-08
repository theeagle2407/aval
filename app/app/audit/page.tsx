import { RequireWallet } from "../components/RequireWallet";
import { AuditView } from "../components/AuditView";

export default function AuditPage() {
  return (
    <RequireWallet>
      <AuditView />
    </RequireWallet>
  );
}
