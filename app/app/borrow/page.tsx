import { RequireWallet } from "../components/RequireWallet";
import { PlaceholderView } from "../components/PlaceholderView";

export default function BorrowPage() {
  return (
    <RequireWallet>
      <PlaceholderView title="Borrow" note="Wired up in step 4." />
    </RequireWallet>
  );
}
