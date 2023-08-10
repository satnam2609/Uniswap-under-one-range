//SPDX-License-Identifier:UNLICENSE
pragma solidity ^0.8.14;

import "./interfaces/IUniswapV3MintCallback.sol";
import "./interfaces/IUniswapV3SwapCallback.sol";
import "./ERC20.sol";

import "./lib/Math.sol";
import "./lib/SwapMath.sol";
import "./lib/Tick.sol";
import "./lib/TickBitmap.sol";
import "./lib/Position.sol";
import "./lib/TickMath.sol";

contract UniswapV3Pool {
    using Tick for mapping(int24 => Tick.Info);
    using TickBitmap for mapping(int16 => uint256);
    using Position for mapping(bytes32 => Position.Info);
    using Position for Position.Info;

    error InsufficientInputAmount();
    error InvalidTickRange();
    error ZeroLiquidity();

    event Mint(
        address sender,
        address indexed owner,
        int24 indexed tickLower,
        int24 indexed tickUpper,
        uint128 amount,
        uint256 amount0,
        uint256 amount1
    );

    event Swap(
        address indexed sender,
        address indexed recipient,
        int256 amount0,
        int256 amount1,
        uint160 sqrtPriceX96,
        uint128 liquidity,
        int24 tick
    );

    uint128 liquidity;

    int256 public constant MIN_TICK = -887272;
    int256 public constant MAX_TICK = -MIN_TICK;

    struct Slot0 {
        //current sqrtPriceX96
        uint160 sqrtPriceX96;
        //currentTick
        int24 tick;
    }

    Slot0 public slot0;

    struct CallbackData {
        address token0;
        address token1;
        address payer;
    }

    struct SwapState {
        uint160 sqrtPriceX96;
        int24 tick;
        uint256 amountSpecifiedRemaining;
        uint256 amountCalculated;
    }

    struct StepState {
        uint160 sqrtPriceStartX96;
        uint160 sqrtPriceNextX96;
        int24 nextTick;
        uint256 amountIn;
        uint256 amountOut;
    }

    address public immutable token0;
    address public immutable token1;

    mapping(int24 => Tick.Info) public ticks;
    mapping(int16 => uint256) public tickBimap;
    mapping(bytes32 => Position.Info) public positions;

    constructor(
        address _token0,
        address _token1,
        uint160 sqrtPriceX96,
        int24 tick
    ) {
        token0 = _token0;
        token1 = _token1;
        slot0 = Slot0({sqrtPriceX96: sqrtPriceX96, tick: tick});
    }

    function mint(
        address owner,
        int24 lowerTick,
        int24 upperTick,
        uint128 amount,
        bytes calldata data
    ) external returns (uint256 amount0, uint256 amount1) {
        if (
            lowerTick < MIN_TICK ||
            upperTick > MAX_TICK ||
            lowerTick > upperTick
        ) revert InvalidTickRange();

        if (amount == 0) revert ZeroLiquidity();

        bool flippedLower = ticks.update(lowerTick, amount);

        bool flippedUpper = ticks.update(upperTick, amount);

        if (flippedLower) {
            tickBimap.flipTick(lowerTick, 1);
        }

        if (flippedUpper) {
            tickBimap.flipTick(upperTick, 1);
        }

        Position.Info storage position = positions.get(
            owner,
            lowerTick,
            upperTick
        );

        position.update(amount);

        Slot0 memory slot0_ = slot0;

        liquidity += amount;

        amount0 = Math.calcAmount0Delta(
            TickMath.getSqrtRatioAtTick(slot0_.tick),
            TickMath.getSqrtRatioAtTick(upperTick),
            amount
        );
        amount1 = Math.calcAmount1Delta(
            TickMath.getSqrtRatioAtTick(slot0_.tick),
            TickMath.getSqrtRatioAtTick(lowerTick),
            amount
        );

        uint256 balance0Before;
        uint256 balance1Before;
        if (amount0 > 0) balance0Before = balance0();
        if (amount1 > 0) balance1Before = balance1();

        IUniswapV3MintCallback(msg.sender).uniswapV3MintCallback(
            amount0,
            amount1,
            data
        );

        if (amount0 > 0 && balance0Before + amount0 > balance0())
            revert InsufficientInputAmount();
        if (amount1 > 0 && balance1Before + amount1 > balance1())
            revert InsufficientInputAmount();

        emit Mint(
            msg.sender,
            address(this),
            lowerTick,
            upperTick,
            amount,
            amount0,
            amount1
        );
    }

    function swap(
        address recipient,
        bool zeroForOne,
        uint256 amountSpecified,
        bytes calldata data
    ) external returns (int256 amount0, int256 amount1) {
        Slot0 memory slot0_ = slot0;
        SwapState memory state = SwapState({
            sqrtPriceX96: slot0_.sqrtPriceX96,
            tick: slot0_.tick,
            amountSpecifiedRemaining: amountSpecified,
            amountCalculated: 0
        });

        while (state.amountSpecifiedRemaining > 0) {
            StepState memory step;
            step.sqrtPriceStartX96 = state.sqrtPriceX96;
            (step.nextTick, ) = tickBimap.nextInitializedTickWithinOneWord(
                state.tick,
                1,
                zeroForOne
            );

            step.sqrtPriceNextX96 = TickMath.getSqrtRatioAtTick(step.nextTick);

            (state.sqrtPriceX96, step.amountIn, step.amountOut) = SwapMath
                .computeSwapStep(
                    step.sqrtPriceStartX96,
                    step.sqrtPriceNextX96,
                    liquidity,
                    state.amountSpecifiedRemaining
                );

            state.amountSpecifiedRemaining -= step.amountIn;
            state.amountCalculated += step.amountOut;
            state.tick = TickMath.getTickAtSqrtRatio(state.sqrtPriceX96);
        }

        if (slot0_.tick != state.tick) {
            (slot0_.sqrtPriceX96, slot0_.tick) = (
                state.sqrtPriceX96,
                state.tick
            );
        }

        (amount0, amount1) = zeroForOne
            ? (
                (
                    int256(amountSpecified - state.amountSpecifiedRemaining),
                    -int256(state.amountCalculated)
                )
            )
            : (
                -int256(state.amountCalculated),
                int256(amountSpecified - state.amountSpecifiedRemaining)
            );

        if (zeroForOne) {
            ERC20(token1).transfer(recipient, uint256(-amount1));

            uint256 balance0Before = balance0();
            IUniswapV3SwapCallback(msg.sender).uniswapV3SwapCallback(
                amount0,
                amount1,
                data
            );
            if (balance0Before + uint256(amount0) > balance0())
                revert InsufficientInputAmount();
        } else {
            ERC20(token0).transfer(recipient, uint256(-amount0));

            uint256 balance1Before = balance1();
            IUniswapV3SwapCallback(msg.sender).uniswapV3SwapCallback(
                amount0,
                amount1,
                data
            );
            if (balance1Before + uint256(amount1) > balance1())
                revert InsufficientInputAmount();
        }

        emit Swap(
            msg.sender,
            recipient,
            amount0,
            amount1,
            slot0.sqrtPriceX96,
            liquidity,
            slot0.tick
        );
    }

    function balance0() internal view returns (uint256) {
        return ERC20(token0).balanceOf(address(this));
    }

    function balance1() internal view returns (uint256) {
        return ERC20(token1).balanceOf(address(this));
    }
}
