import { RequireWallet } from "../components/RequireWallet";
import { PlaceholderView } from "../components/PlaceholderView";

export default function PoolPage() {
  return (
    <RequireWallet>
      <PlaceholderView title="Pool" note="Wired up in step 2." />
    </RequireWallet>
  );
}
