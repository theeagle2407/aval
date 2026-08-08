import { RequireWallet } from "../components/RequireWallet";
import { Home } from "../components/Home";

export default function HomePage() {
  return (
    <RequireWallet>
      <Home />
    </RequireWallet>
  );
}
