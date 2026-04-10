// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {IFlashLoanReceiver} from "@aave/core-v3/contracts/flashloan/interfaces/IFlashLoanReceiver.sol";
import {IPool} from "@aave/core-v3/contracts/interfaces/IPool.sol";
import {IPoolDataProvider} from "@aave/core-v3/contracts/interfaces/IPoolDataProvider.sol";
import {IERC20} from "@aave/core-v3/contracts/dependencies/openzeppelin/contracts/IERC20.sol";

interface IUniswapV3Router {
    struct ExactInputParams {
        bytes path;
        address recipient;
        uint256 amountIn;
        uint256 amountOutMinimum;
    }
    function exactInput(ExactInputParams calldata params) external payable returns (uint256 amountOut);
}

interface ISushiswapRouter {
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
}

contract FlashloanLiquidator is IFlashLoanReceiver {
    IPool public immutable pool;
    IPoolDataProvider public immutable dataProvider;
    IUniswapV3Router public immutable uniswapRouter;
    ISushiswapRouter public immutable sushiswapRouter;
    address public owner;

    event FlashloanExecuted(address indexed token, uint256 amount, uint256 profit);
    event LiquidationExecuted(address indexed collateral, address indexed debt, uint256 debtToCover);

    constructor(
        address _pool,
        address _dataProvider,
        address _uniswapRouter,
        address _sushiswapRouter
    ) {
        pool = IPool(_pool);
        dataProvider = IPoolDataProvider(_dataProvider);
        uniswapRouter = IUniswapV3Router(_uniswapRouter);
        sushiswapRouter = ISushiswapRouter(_sushiswapRouter);
        owner = msg.sender;
    }

    function executeFlashloan(
        address token,
        uint256 amount,
        bytes calldata params
    ) external onlyOwner {
        address[] memory tokens = new address[](1);
        tokens[0] = token;
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = amount;
        uint256[] memory modes = new uint256[](1);
        modes[0] = 0;

        pool.flashLoan(
            address(this),
            tokens,
            amounts,
            modes,
            address(this),
            params,
            0
        );
    }

    function executeOperation(
        address asset,
        uint256 amount,
        uint256 premium,
        address initiator,
        bytes calldata params
    ) external override returns (bytes32) {
        require(msg.sender == address(pool), "Unauthorized");
        require(initiator == address(this), "Invalid initiator");

        (address collateral, address debtToken, uint256 debtToCover, bool useUniswap) = 
            abi.decode(params, (address, address, uint256, bool));

        uint256 profitAmount = _executeLiquidation(
            asset,
            amount,
            collateral,
            debtToken,
            debtToCover,
            useUniswap
        );

        uint256 amountOwed = amount + premium;
        IERC20(asset).approve(address(pool), amountOwed);

        emit FlashloanExecuted(asset, amount, profitAmount);

        return keccak256("ERC3156FlashBorrower.onFlashLoan");
    }

    function _executeLiquidation(
        address flashToken,
        uint256 flashAmount,
        address collateral,
        address debtToken,
        uint256 debtToCover,
        bool useUniswap
    ) internal returns (uint256 profit) {
        if (useUniswap) {
            _swapUniswap(flashToken, debtToken, flashAmount);
        } else {
            _swapSushiswap(flashToken, debtToken, flashAmount);
        }

        IERC20(debtToken).approve(address(pool), debtToCover);
        pool.liquidationCall(collateral, debtToken, msg.sender, debtToCover, false);

        uint256 collateralBalance = IERC20(collateral).balanceOf(address(this));
        if (useUniswap) {
            _swapUniswap(collateral, flashToken, collateralBalance);
        } else {
            _swapSushiswap(collateral, flashToken, collateralBalance);
        }

        uint256 flashTokenBalance = IERC20(flashToken).balanceOf(address(this));
        profit = flashTokenBalance > flashAmount ? flashTokenBalance - flashAmount : 0;

        emit LiquidationExecuted(collateral, debtToken, debtToCover);
    }

    function _swapUniswap(address tokenIn, address tokenOut, uint256 amountIn) internal {
        IERC20(tokenIn).approve(address(uniswapRouter), amountIn);

        IUniswapV3Router.ExactInputParams memory params = IUniswapV3Router.ExactInputParams({
            path: abi.encodePacked(tokenIn, uint24(3000), tokenOut),
            recipient: address(this),
            amountIn: amountIn,
            amountOutMinimum: 0
        });

        uniswapRouter.exactInput(params);
    }

    function _swapSushiswap(address tokenIn, address tokenOut, uint256 amountIn) internal {
        IERC20(tokenIn).approve(address(sushiswapRouter), amountIn);

        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = tokenOut;

        sushiswapRouter.swapExactTokensForTokens(
            amountIn,
            0,
            path,
            address(this),
            block.timestamp + 300
        );
    }

    function withdraw(address token) external onlyOwner {
        uint256 balance = IERC20(token).balanceOf(address(this));
        IERC20(token).transfer(owner, balance);
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    receive() external payable {}
}