import { RequireWallet } from "../components/RequireWallet";
import { PlaceholderView } from "../components/PlaceholderView";

export default function CompliancePage() {
  return (
    <RequireWallet>
      <PlaceholderView title="Compliance" note="Wired up in step 2." />
    </RequireWallet>
  );
}
