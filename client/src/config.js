import ERC20 from "./abi/ERC20.json";
import Pool from "./abi/Pool.json";
import Manager from "./abi/Manager.json";
import Quoter from "./abi/Quoter.json";
const config = {
  token0Address: "0x0A332b1255b411E130554D8D3d74CeEFcba622aa",
  token1Address: "0x6D95A3C2ccE80b9cD855e884542A28d1aBbFCcb6",
  poolAddress: "0xB3f72FC297E04DbC78b1D2C3Ccf6412E4b6f9c1a",
  managerAddress: "0xb6f368be4E14163f8Cf2B55010ddF64bcc345286",
  quoterAddress: "0x879CA627D7C4dA5Ea10A92545CE9a3eDbfA71E69",
  ABIs: {
    ERC20,
    Pool,
    Manager,
    Quoter,
  },
};

export default config;
