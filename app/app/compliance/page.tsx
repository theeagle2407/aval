import { RequireWallet } from "../components/RequireWallet";
import { ComplianceView } from "../components/ComplianceView";

export default function CompliancePage() {
  return (
    <RequireWallet>
      <ComplianceView />
    </RequireWallet>
  );
}
