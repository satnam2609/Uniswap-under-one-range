import { useState, createContext } from "react";

export const MetaMaskContext = createContext();

const MetaMaskProvider = ({ children }) => {
  const [status, setStatus] = useState("not_connected");
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);

  function connect() {
    if (typeof window.ethereum === "undefined") {
      setStatus("not_installed");
    } else {
      Promise.all([
        window.ethereum.request({ method: "eth_requestAccounts" }),
        window.ethereum.request({ method: "eth_chainId" }),
      ])
        .then(([accounts, chain]) => {
          setAccount(accounts[0]);
          setChainId(chain);
          setStatus("connected");
        })
        .catch((err) => console.log(err.message));
    }
  }

  const metamaskContext = { status, account, chainId, connect };

  return (
    <MetaMaskContext.Provider value={metamaskContext}>
      {children}
    </MetaMaskContext.Provider>
  );
};

export default MetaMaskProvider;
