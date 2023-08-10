require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
      },
    },
  },
  allowUnlimitedContractSize: true,
  networks: {
    ganache: {
      url: "HTTP://127.0.0.1:7545",
    },
    sepolia: {
      url: `url`,
      accounts: [`pkey`, "pkey"],
    },
    localhost: {
      url: "http://127.0.0.1:8545/",
    },
  },
};
