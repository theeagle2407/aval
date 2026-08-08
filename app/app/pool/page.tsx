import { RequireWallet } from "../components/RequireWallet";
import { PoolView } from "../components/PoolView";

export default function PoolPage() {
  return (
    <RequireWallet>
      <PoolView />
    </RequireWallet>
  );
}
