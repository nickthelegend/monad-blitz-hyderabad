// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ChainlinkOracle.sol";

/**
 * @title MolFiPerpDEX
 * @dev A simplified Perpetual DEX engine for the MolFi protocol.
 */
contract MolFiPerpDEX {
    ChainlinkOracle public oracle;

    struct Position {
        uint256 size;       // Position size in base units (scaled 1e18)
        uint256 entryPrice; // Price when opened (scaled 1e18)
        bool isLong;        // True for Long, False for Short
        bool exists;        // Helper to check position existence
    }

    // Mapping of trader address to their active position
    mapping(address => Position) public positions;

    event PositionOpened(address indexed trader, uint256 size, uint256 entryPrice, bool isLong);
    event PositionClosed(address indexed trader, uint256 exitPrice, int256 pnl);

    /**
     * @param _oracle The address of the deployed MolFi ChainlinkOracle contract
     */
    constructor(address _oracle) {
        oracle = ChainlinkOracle(_oracle);
    }

    /**
     * @notice Opens a perpetual position using the current oracle price.
     * @param _size The size of the position (scaled 1e18).
     * @param _isLong Long if true, Short if false.
     */
    function openPosition(uint256 _size, bool _isLong) external {
        uint256 price = oracle.getLatestPriceScaled();
        require(price > 0, "Invalid oracle price");

        positions[msg.sender] = Position({
            size: _size,
            entryPrice: price,
            isLong: _isLong,
            exists: true
        });

        emit PositionOpened(msg.sender, _size, price, _isLong);
    }

    /**
     * @notice Calculates the unrealized PnL for a trader's position.
     * @param _trader The address of the trader.
     * @return The PnL (positive for profit, negative for loss) scaled 1e18.
     */
    function unrealizedPnL(address _trader) public view returns (int256) {
        Position storage pos = positions[_trader];
        require(pos.exists, "No active position");

        uint256 currentPrice = oracle.getLatestPriceScaled();
        int256 pnl;

        if (pos.isLong) {
            // Long PnL = (Current Price - Entry Price) * Size / Entry Price
            pnl = (int256(currentPrice) - int256(pos.entryPrice)) * int256(pos.size) / int256(pos.entryPrice);
        } else {
            // Short PnL = (Entry Price - Current Price) * Size / Entry Price
            pnl = (int256(pos.entryPrice) - int256(currentPrice)) * int256(pos.size) / int256(pos.entryPrice);
        }

        return pnl;
    }

    /**
     * @notice Checks if a position should be liquidated.
     * @param _trader The address of the trader.
     * @param _maintenanceMargin The minimum equity required (scaled 1e18).
     * @return True if equity is below maintenance margin.
     */
    function shouldLiquidate(address _trader, uint256 _maintenanceMargin) public view returns (bool) {
        Position storage pos = positions[_trader];
        require(pos.exists, "No active position");

        int256 pnl = unrealizedPnL(_trader);
        
        // Equity = Position Size (initial margin) + PnL
        // This is a simplified liquidation model
        int256 equity = int256(pos.size) + pnl;

        return equity < int256(_maintenanceMargin);
    }

    /**
     * @notice Returns the position details for a trader.
     */
    function getPosition(address _trader) external view returns (Position memory) {
        return positions[_trader];
    }
}
