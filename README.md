# Flashloan Liquidation Bot

An automated liquidation bot for Arbitrum that uses Aave V3 flashloans to liquidate underwater positions on Uniswap V3 and Sushiswap pools.

## 🎯 Overview

This bot monitors Aave V3 lending pools on Arbitrum for liquidation opportunities and executes them profitably using flashloans. It leverages:

- **Aave V3 Flashloans** - Borrow tokens interest-free for liquidation execution
- **Uniswap V3** - Primary token swap venue with optimal routing
- **Sushiswap** - Fallback liquidity source for swaps
- **Arbitrum** - Low-cost, fast execution environment

## 📋 Prerequisites

- Node.js 16+ and npm
- Arbitrum RPC endpoint (Infura, Alchemy, or public)
- Private key with ETH for gas fees (~0.1 ETH recommended for testing)
- Hardhat and development tools

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```env
ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc
PRIVATE_KEY=your_private_key_here
MIN_PROFIT_USD=100
LIQUIDATOR_ADDRESS=your_deployed_contract_address
```

### 3. Compile Smart Contract

```bash
npm run compile
```

### 4. Deploy to Arbitrum

```bash
npm run deploy
```

Update `LIQUIDATOR_ADDRESS` in `.env` with the deployed contract address.

### 5. Start the Bot

```bash
npm start
```

## 🏗️ Architecture

### Smart Contract (FlashloanLiquidator.sol)

The main liquidation contract with three core functions:

- `executeFlashloan()` - Initiates Aave flashloan
- `executeOperation()` - Callback invoked by Aave with borrowed tokens
- `_executeLiquidation()` - Performs the actual liquidation and arbitrage

**Flow:**
1. Borrow tokens via Aave flashloan
2. Swap borrowed tokens for debt tokens using Uniswap/Sushiswap
3. Liquidate the underwater position on Aave
4. Receive collateral tokens
5. Swap collateral back to borrowed token
6. Repay flashloan + premium
7. Pocket the profit

### Bot (bot.js)

The monitoring script that:

- Connects to Arbitrum RPC
- Scans Aave for liquidation events
- Monitors user health factors
- Identifies profitable opportunities
- Triggers flashloan executions

## 📊 Arbitrum Addresses

| Contract | Address |
|----------|---------|
| Aave V3 Pool | 0x794a61eF305235E7cb740908c94EA38A6b6E2C19 |
| Pool Data Provider | 0x69FA688f1Dc47d4B5d8029D5a35FB7a548310635 |
| Uniswap V3 Router | 0xE592427A0AEce92De3Edee1F18E0157C05861564 |
| Sushiswap Router | 0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506 |

## 🔧 Configuration Options

| Variable | Default | Purpose |
|----------|---------|---------|
| ARBITRUM_RPC_URL | Public | RPC endpoint for Arbitrum |
| PRIVATE_KEY | Required | Your wallet private key |
| MIN_PROFIT_USD | 100 | Minimum profit to execute liquidation |
| POLLING_INTERVAL_MS | 5000 | Bot scan frequency (ms) |
| MAX_GAS_PRICE_GWEI | 5 | Max gas price threshold |

## 📚 Development

### Run Tests

```bash
npm test
```

### Local Fork Testing

```env
FORKING=true
```

Then deploy and test on the forked network.

### Gas Reporting

```env
REPORT_GAS=true
```

## ⚠️ Important Notes

1. **Security**: This is for educational purposes. Always audit before mainnet deployment.
2. **Gas Optimization**: Consider implementing MEV protection and slippage limits.
3. **Profit Margins**: Ensure liquidation premium + gas costs < profit margin
4. **Network Congestion**: High gas prices can reduce profitability
5. **Risks**: Smart contract bugs, price slippage, and failed transactions

## 🔒 Security Considerations

- [ ] Add slippage protection on swaps
- [ ] Implement health factor checks before liquidation
- [ ] Add multi-sig wallet for production
- [ ] Audit smart contract before mainnet
- [ ] Monitor gas prices and adjust thresholds
- [ ] Implement emergency pause function

## 📈 Optimization Ideas

1. **Multi-hop Swaps** - Use 1inch or similar for better rates
2. **Batch Liquidations** - Execute multiple liquidations per flashloan
3. **MEV Protection** - Use private mempool services
4. **Dynamic Fees** - Adjust gas price based on network conditions
5. **Position Hedging** - Lock in profits with options

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Submit a pull request
4. Include tests and documentation

## 📝 License

MIT

## 🆘 Support

For issues, questions, or improvements:

- Create a GitHub issue
- Check existing documentation
- Review Aave V3 docs: https://docs.aave.com/
- Arbitrum guides: https://docs.arbitrum.io/

## 📚 Resources

- [Aave V3 Documentation](https://docs.aave.com/)
- [Arbitrum Network](https://arbitrum.io/)
- [Uniswap V3 SDK](https://docs.uniswap.org/)
- [Sushiswap Documentation](https://docs.sushi.com/)
- [Hardhat Docs](https://hardhat.org/)

---

**⚡ Built for Arbitrum • Powered by Aave V3 • Liquidating efficiently**