// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

/**
 * @title ChainlinkOracle
 * @notice Fetches price data from Chainlink price feeds
 * @dev Supports BTC/USDT and ETH/USDT pairs with price validation
 */
contract ChainlinkOracle {
    // Price feed addresses
    mapping(string => address) public priceFeeds;
    
    // Owner for management
    address public owner;
    
    // Price staleness threshold (1 hour)
    uint256 public constant STALENESS_THRESHOLD = 1 hours;
    
    // Events
    event PriceFeedUpdated(string indexed pair, address indexed feed);
    event PriceFetched(string indexed pair, uint256 price, uint256 timestamp);
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    constructor() {
        owner = msg.sender;
    }
    
    /**
     * @notice Add or update a price feed
     * @param pair Trading pair (e.g., "BTC/USDT")
     * @param feed Chainlink aggregator address
     */
    function setPriceFeed(string memory pair, address feed) external onlyOwner {
        require(feed != address(0), "Invalid feed address");
        priceFeeds[pair] = feed;
        emit PriceFeedUpdated(pair, feed);
    }
    
    /**
     * @notice Get latest price for a pair
     * @param pair Trading pair (e.g., "BTC/USDT")
     * @return price Price in 18 decimals
     */
    function getLatestPrice(string memory pair) public view returns (uint256) {
        address feed = priceFeeds[pair];
        require(feed != address(0), "Price feed not set");
        
        AggregatorV3Interface priceFeed = AggregatorV3Interface(feed);
        
        (
            ,
            int256 price,
            ,
            uint256 updatedAt,
            
        ) = priceFeed.latestRoundData();
        
        require(price > 0, "Invalid price");
        require(updatedAt > block.timestamp - STALENESS_THRESHOLD, "Stale price");
        
        // Convert from 8 decimals to 18 decimals
        uint256 priceScaled = uint256(price) * 1e10;
        
        return priceScaled;
    }
    
    /**
     * @notice Get price with full validation
     * @param pair Trading pair
     * @return price Price in 18 decimals
     * @return timestamp Last update timestamp
     * @return roundId Round ID from Chainlink
     */
    function getPriceWithMetadata(string memory pair) 
        external 
        view 
        returns (
            uint256 price,
            uint256 timestamp,
            uint80 roundId
        ) 
    {
        address feed = priceFeeds[pair];
        require(feed != address(0), "Price feed not set");
        
        AggregatorV3Interface priceFeed = AggregatorV3Interface(feed);
        
        (
            uint80 _roundId,
            int256 _price,
            ,
            uint256 _updatedAt,
            uint80 answeredInRound
        ) = priceFeed.latestRoundData();
        
        require(_price > 0, "Invalid price");
        require(_updatedAt > block.timestamp - STALENESS_THRESHOLD, "Stale price");
        require(answeredInRound >= _roundId, "Stale round");
        
        // Convert from 8 decimals to 18 decimals
        price = uint256(_price) * 1e10;
        timestamp = _updatedAt;
        roundId = _roundId;
    }
    
    /**
     * @notice Get decimals for a price feed
     * @param pair Trading pair
     * @return decimals Number of decimals
     */
    function getDecimals(string memory pair) external view returns (uint8) {
        address feed = priceFeeds[pair];
        require(feed != address(0), "Price feed not set");
        
        return AggregatorV3Interface(feed).decimals();
    }
    
    /**
     * @notice Check if price feed exists
     * @param pair Trading pair
     * @return exists Whether feed is configured
     */
    function hasPriceFeed(string memory pair) external view returns (bool) {
        return priceFeeds[pair] != address(0);
    }
}
