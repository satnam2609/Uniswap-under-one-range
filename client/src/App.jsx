import { useState } from "react";
import MetaMaskProvider from "./contexts/MetaMask";

import MetaMask from "./components/MetaMask";
import SwapForm from "./components/SwapForm";
import EventsFeed from "./components/EventsFeed";

function App() {
  const [count, setCount] = useState(0);

  return (
    //#0b0242
    <MetaMaskProvider>
      <div className="w-full h-screen flex flex-col items-center bg-gradient-to-r from-[#0a0909] via-[#046874] to-[#0a0808] space-y-8">
        <MetaMask />
        <SwapForm />
        <footer>
          <EventsFeed />
        </footer>
      </div>
    </MetaMaskProvider>
  );
}

export default App;
