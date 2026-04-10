const hre = require("hardhat");

async function main() {
  console.log("Deploying FlashloanLiquidator to Arbitrum...");

  const AAVE_POOL = process.env.AAVE_POOL || "0x794a61eF305235E7cb740908c94EA38A6b6E2C19";
  const AAVE_POOL_DATA_PROVIDER = process.env.AAVE_POOL_DATA_PROVIDER || "0x69FA688f1Dc47d4B5d8029D5a35FB7a548310635";
  const UNISWAP_V3_ROUTER = process.env.UNISWAP_V3_ROUTER || "0xE592427A0AEce92De3Edee1F18E0157C05861564";
  const SUSHISWAP_ROUTER = process.env.SUSHISWAP_ROUTER || "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506";

  const FlashloanLiquidator = await hre.ethers.getContractFactory("FlashloanLiquidator");
  const liquidator = await FlashloanLiquidator.deploy(
    AAVE_POOL,
    AAVE_POOL_DATA_PROVIDER,
    UNISWAP_V3_ROUTER,
    SUSHISWAP_ROUTER
  );

  await liquidator.deployed();

  console.log("FlashloanLiquidator deployed to:", liquidator.address);
  console.log("\nContract Details:");
  console.log("- Aave Pool:", AAVE_POOL);
  console.log("- Uniswap Router:", UNISWAP_V3_ROUTER);
  console.log("- Sushiswap Router:", SUSHISWAP_ROUTER);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });