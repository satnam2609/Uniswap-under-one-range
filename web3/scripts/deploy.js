// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

async function main() {
  const accounts = await hre.ethers.getSigners();

  const WETH = await hre.ethers.deployContract("ERC20", [
    "WRAPPED_ETHER",
    "wETH",
    18,
    "100",
  ]);
  await WETH.waitForDeployment();
  const USDC = await hre.ethers.deployContract("ERC20", [
    "USDC",
    "USDC",
    18,
    "100000",
  ]);
  await USDC.waitForDeployment();

  await WETH.connect(accounts[0]).approve(
    await accounts[1].getAddress(),
    "10000000000000000000"
  );
  await USDC.connect(accounts[0]).approve(
    await accounts[1].getAddress(),
    "1000000000000000000000"
  );
  await WETH.connect(accounts[0]).transfer(
    await accounts[1].getAddress(),
    "10000000000000000000"
  );

  await USDC.connect(accounts[0]).transfer(
    await accounts[1].getAddress(),
    "1000000000000000000000"
  );

  console.log(await WETH.balanceOf(await accounts[1].getAddress()));

  const UniswapV3Pool = await hre.ethers.deployContract("UniswapV3Pool", [
    await WETH.getAddress(),
    await USDC.getAddress(),
    "3543191142285914378072636784640",
    76012,
  ]);

  await UniswapV3Pool.waitForDeployment();

  const UniswapV3Manager = await hre.ethers.deployContract("UniswapV3Manager");
  await UniswapV3Manager.waitForDeployment();

  const UniswapV3Quoter = await hre.ethers.deployContract("UniswapV3Quoter");
  await UniswapV3Quoter.waitForDeployment();

  console.log("WETH address", await WETH.getAddress());
  console.log("USDC address", await USDC.getAddress());
  console.log("Pool address", await UniswapV3Pool.getAddress());
  console.log("Manager address", await UniswapV3Manager.getAddress());
  console.log("Quoter address", await UniswapV3Quoter.getAddress());
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
