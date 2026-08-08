import { RequireWallet } from "../components/RequireWallet";
import { BorrowView } from "../components/BorrowView";

export default function BorrowPage() {
  return (
    <RequireWallet>
      <BorrowView />
    </RequireWallet>
  );
}
