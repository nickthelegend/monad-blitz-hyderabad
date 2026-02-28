// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

/**
 * @title ChainlinkOracle
 * @dev Consumer contract for fetching the latest price from a Chainlink feed.
 */
contract ChainlinkOracle {
    AggregatorV3Interface public priceFeed;

    /**
     * @param _feed The address of the Chainlink Price Feed (e.g., BTC/USD or ETH/USD)
     */
    constructor(address _feed) {
        priceFeed = AggregatorV3Interface(_feed);
    }

    /**
     * @notice Returns the latest price from the feed.
     * @return The latest price with 8 decimals.
     */
    function getLatestPrice() public view returns (uint256) {
        (
            /* uint80 roundID */,
            int price,
            /* uint startedAt */,
            /* uint timeStamp */,
            /* uint80 answeredInRound */
        ) = priceFeed.latestRoundData();
        
        require(price > 0, "Invalid price data");
        return uint256(price);
    }

    /**
     * @notice Returns the price scaled to 18 decimals.
     * @return The price scaled to 1e18.
     */
    function getLatestPriceScaled() public view returns (uint256) {
        return getLatestPrice() * 1e10; // Convert 8 -> 18 decimals
    }

    /**
     * @return The number of decimals in the source feed.
     */
    function getDecimals() public view returns (uint8) {
        return priceFeed.decimals();
    }
}
