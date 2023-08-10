import React, { useState, useContext } from "react";
import { MetaMaskContext } from "../contexts/MetaMask";

const getChainFromChaiId = (chainId) => {
  switch (chainId) {
    case "0x1": {
      return "Mainnet";
      break;
    }
    case "0xaa36a7": {
      return "Sepolia";
      break;
    }
    case "0x7a69": {
      return "Hardhat";
      break;
    }
    case "0x539": {
      return "Ganache";
      break;
    }
    default: {
      return "unknown chain";
    }
  }
};

const shortAddress = (address) => {
  if (address) {
    return address.slice(0, 6) + "..." + address.slice(-4);
  } else {
    return "";
  }
};

const connectToMeta = (connect) => {
  return <button onClick={() => connect()}>Connect</button>;
};
const renderStatus = (status, chainId, account, connect) => {
  if (status === "not_connected") {
    return connectToMeta(connect);
  } else if (status === "not_installed") {
    return "Metamask is not installed!";
  } else {
    return `Connected to ${getChainFromChaiId(chainId)} as ${shortAddress(
      account
    )}`;
  }
};

const MetaMask = () => {
  const { account, status, chainId, connect } = useContext(MetaMaskContext);
  console.log(shortAddress(account));
  return (
    <div className="px-4 py-2 mt-5 text-white bg-[#6868688e] rounded-xl ">
      {renderStatus(status, chainId, account, connect)}
    </div>
  );
};

export default MetaMask;
