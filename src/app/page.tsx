import SwapPage from "@/Components/SwapPage/SwapPage";
import { WalletDebugger } from "@/Components/ConnectWallet/WalletDebugger";
import "../Styles/fonts.module.css"

export default function Home() {
  return (
    <div className="font-vt323 tracking-wider">
      <SwapPage />
      {/* <WalletDebugger /> */}
    </div>
  );
}
