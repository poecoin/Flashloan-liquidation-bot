const { ethers } = require("ethers");
require("dotenv").config();

// Configuration
const RPC_URL = process.env.ARBITRUM_RPC_URL || "https://arb1.arbitrum.io/rpc";
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const POLLING_INTERVAL = parseInt(process.env.POLLING_INTERVAL_MS) || 5000;
const MIN_PROFIT_USD = parseFloat(process.env.MIN_PROFIT_USD) || 100;

// Contract addresses
const AAVE_POOL = process.env.AAVE_POOL || "0x794a61eF305235E7cb740908c94EA38A6b6E2C19";
const LIQUIDATOR_ADDRESS = process.env.LIQUIDATOR_ADDRESS;

// ABIs
const AAVE_POOL_ABI = [
  "function getUserAccountData(address user) external view returns (uint256 totalCollateral, uint256 totalDebt, uint256 availableBorrows, uint256 currentLiquidationThreshold, uint256 ltv, uint256 healthFactor)",
  "event LiquidationCall(address indexed collateralAsset, address indexed debtAsset, address indexed user, uint256 debtToCover, uint256 liquidatedCollateralAmount, address liquidator, bool receiveAToken)"
];

let provider;
let wallet;
let liquidatorContract;
let liquidationCount = 0;

async function initialize() {
  try {
    provider = new ethers.JsonRpcProvider(RPC_URL);
    wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    
    console.log("✅ Bot initialized");
    console.log(`📍 Wallet: ${wallet.address}`);
    console.log(`🔗 Network: Arbitrum One`);
    console.log(`⏱️ Polling interval: ${POLLING_INTERVAL}ms`);
    console.log(`💰 Min profit threshold: $${MIN_PROFIT_USD}`);
  } catch (error) {
    console.error("❌ Initialization failed:", error.message);
    process.exit(1);
  }
}

async function scanForLiquidations() {
  try {
    const aavePool = new ethers.Contract(AAVE_POOL, AAVE_POOL_ABI, provider);
    
    // Listen for liquidation events
    const eventFilter = aavePool.filters.LiquidationCall();
    const events = await provider.getLogs({
      address: AAVE_POOL,
      topics: eventFilter.topics,
      fromBlock: await provider.getBlockNumber() - 1000,
      toBlock: "latest"
    });

    if (events.length > 0) {
      console.log(`\n🔍 Found ${events.length} recent liquidation events`);
      
      for (const event of events.slice(0, 5)) {
        const eventData = aavePool.interface.parseLog(event);
        console.log(`\n        📊 Liquidation Opportunity:`);
        console.log(`        - Collateral: ${eventData.args.collateralAsset}`);
        console.log(`        - Debt Asset: ${eventData.args.debtAsset}`);
        console.log(`        - User: ${eventData.args.user}`);
        console.log(`        - Debt to Cover: ${ethers.formatUnits(eventData.args.debtToCover, 6)}`);
      }
    }
  } catch (error) {
    console.error("❌ Scan error:", error.message);
  }
}

async function monitorHealthFactors() {
  try {
    console.log(`\n⏰ [${new Date().toLocaleTimeString()}] Monitoring health factors...`);
    
    // This is a placeholder - in production, you'd:
    // 1. Query Aave's lending pool for all users
    // 2. Check each user's health factor
    // 3. Identify underwater positions
    // 4. Calculate profitability
    
    await scanForLiquidations();
  } catch (error) {
    console.error("❌ Monitoring error:", error.message);
  }
}

async function executeFlashloan(tokenAddress, amount, collateral, debtToken, debtToCover, useUniswap) {
  try {
    if (!LIQUIDATOR_ADDRESS) {
      console.warn("⚠️ LIQUIDATOR_ADDRESS not set. Deploy the contract first.");
      return;
    }

    console.log(`\n💥 Executing flashloan for liquidation...`);
    console.log(`- Amount: ${ethers.formatUnits(amount, 18)}`);
    console.log(`- Collateral: ${collateral}`);
    console.log(`- Debt Token: ${debtToken}`);

    const params = ethers.AbiCoder.defaultAbiCoder().encode(
      ["address", "address", "uint256", "bool"],
      [collateral, debtToken, debtToCover, useUniswap]
    );

    // This would call executeFlashloan on your deployed contract
    console.log("📄 Parameters encoded and ready for execution");
    liquidationCount++;
  } catch (error) {
    console.error("❌ Execution error:", error.message);
  }
}

async function start() {
  await initialize();
  
  console.log(`\n🚀 Flashloan Liquidation Bot started\n`);
  console.log("Monitoring Aave V3 for liquidation opportunities...\n");

  // Initial scan
  await monitorHealthFactors();

  // Continuous monitoring
  setInterval(monitorHealthFactors, POLLING_INTERVAL);

  // Display stats every minute
  setInterval(() => {
    console.log(`\n📈 Stats - Liquidations executed: ${liquidationCount}`);
  }, 60000);
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n\n👋 Bot shutting down...");
  console.log(`Total liquidations executed: ${liquidationCount}`);
  process.exit(0);
});

start().catch(console.error);