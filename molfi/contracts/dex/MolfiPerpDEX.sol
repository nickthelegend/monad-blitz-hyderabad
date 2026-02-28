// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../oracles/ChainlinkOracle.sol";

/**
 * @title MolfiPerpDEX
 * @notice Perpetual futures DEX with Chainlink oracle integration
 * @dev Supports BTC/USDT and ETH/USDT with leverage up to 50x
 */
contract MolfiPerpDEX {
    // Oracle reference
    ChainlinkOracle public oracle;
    IERC20 public usdc;
    
    // Owner
    address public owner;
    
    // Position counter
    uint256 public nextPositionId = 1;
    
    // Structs
    struct Position {
        uint256 id;
        address trader;
        address agent;          // Agent that opened position
        string pair;            // "BTC/USDT" or "ETH/USDT"
        uint256 size;           // Position size in USD (18 decimals)
        uint256 collateral;     // Collateral amount in USD (18 decimals)
        uint256 entryPrice;     // Entry price (18 decimals)
        uint256 leverage;       // Leverage (1-50)
        bool isLong;            // Long or short
        uint256 timestamp;      // Open timestamp
        int256 fundingIndex;    // Funding rate index
        bool isOpen;            // Position status
    }
    
    // Mappings
    mapping(uint256 => Position) public positions;
    mapping(address => uint256[]) public traderPositions;
    mapping(address => uint256[]) public agentPositions;
    
    // Constants
    uint256 public constant MIN_LEVERAGE = 1;
    uint256 public constant MAX_LEVERAGE = 50;
    uint256 public constant LIQUIDATION_THRESHOLD = 80; // 80% of collateral
    uint256 public constant PRECISION = 1e18;
    
    // Events
    event PositionOpened(
        uint256 indexed positionId,
        address indexed trader,
        address indexed agent,
        string pair,
        uint256 size,
        uint256 entryPrice,
        uint256 leverage,
        bool isLong
    );
    
    event PositionClosed(
        uint256 indexed positionId,
        address indexed trader,
        uint256 exitPrice,
        int256 pnl
    );
    
    event PositionLiquidated(
        uint256 indexed positionId,
        address indexed liquidator,
        uint256 liquidationPrice
    );
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    constructor(address _oracle, address _usdc) {
        require(_oracle != address(0), "Invalid oracle");
        require(_usdc != address(0), "Invalid usdc");
        oracle = ChainlinkOracle(_oracle);
        usdc = IERC20(_usdc);
        owner = msg.sender;
    }
    
    /**
     * @notice Open a new position
     * @param agent Agent address opening the position
     * @param pair Trading pair ("BTC/USDT" or "ETH/USDT")
     * @param size Position size in USD
     * @param collateral Collateral amount in USD
     * @param leverage Leverage (1-50)
     * @param isLong Long or short
     * @return positionId ID of opened position
     */
    function openPosition(
        address agent,
        string memory pair,
        uint256 size,
        uint256 collateral,
        uint256 leverage,
        bool isLong
    ) external returns (uint256) {
        require(agent != address(0), "Invalid agent");
        require(size > 0, "Invalid size");
        require(collateral > 0, "Invalid collateral");
        require(leverage >= MIN_LEVERAGE && leverage <= MAX_LEVERAGE, "Invalid leverage");
        require(size <= collateral * leverage, "Size exceeds leveraged collateral");
        
        // Physical transfer of collateral to DEX
        require(usdc.transferFrom(msg.sender, address(this), collateral), "Collateral transfer failed");

        // Get current price from oracle
        uint256 entryPrice = oracle.getLatestPrice(pair);
        require(entryPrice > 0, "Invalid price");
        
        // Create position
        uint256 positionId = nextPositionId++;
        
        positions[positionId] = Position({
            id: positionId,
            trader: msg.sender,
            agent: agent,
            pair: pair,
            size: size,
            collateral: collateral,
            entryPrice: entryPrice,
            leverage: leverage,
            isLong: isLong,
            timestamp: block.timestamp,
            fundingIndex: 0,
            isOpen: true
        });
        
        traderPositions[msg.sender].push(positionId);
        agentPositions[agent].push(positionId);
        
        emit PositionOpened(
            positionId,
            msg.sender,
            agent,
            pair,
            size,
            entryPrice,
            leverage,
            isLong
        );
        
        return positionId;
    }
    
    /**
     * @notice Close a position
     * @param positionId ID of position to close
     * @return pnl Profit or loss
     */
    function closePosition(uint256 positionId) external returns (int256 pnl) {
        Position storage position = positions[positionId];
        
        require(position.isOpen, "Position not open");
        require(position.trader == msg.sender, "Not position owner");
        
        // Get current price
        uint256 exitPrice = oracle.getLatestPrice(position.pair);
        
        // Calculate PnL
        pnl = calculatePnL(positionId, exitPrice);
        
        // Settlement: return collateral + pnl
        int256 payout = int256(position.collateral) + pnl;
        if (payout > 0) {
            require(usdc.transfer(msg.sender, uint256(payout)), "Settlement failed");
        }

        // Close position
        position.isOpen = false;
        
        emit PositionClosed(positionId, msg.sender, exitPrice, pnl);
        
        return pnl;
    }
    
    /**
     * @notice Calculate unrealized PnL for a position
     * @param positionId Position ID
     * @param currentPrice Current market price
     * @return pnl Unrealized profit or loss
     */
    function calculatePnL(uint256 positionId, uint256 currentPrice) 
        public 
        view 
        returns (int256 pnl) 
    {
        Position storage position = positions[positionId];
        require(position.id > 0, "Position does not exist");
        
        int256 priceDiff;
        
        if (position.isLong) {
            priceDiff = int256(currentPrice) - int256(position.entryPrice);
        } else {
            priceDiff = int256(position.entryPrice) - int256(currentPrice);
        }
        
        // PnL = (priceDiff / entryPrice) * size * leverage
        pnl = (priceDiff * int256(position.size) * int256(position.leverage)) / int256(position.entryPrice);
        
        return pnl;
    }
    
    /**
     * @notice Calculate liquidation price for a position
     * @param positionId Position ID
     * @return liquidationPrice Price at which position gets liquidated
     */
    function getLiquidationPrice(uint256 positionId) 
        public 
        view 
        returns (uint256 liquidationPrice) 
    {
        Position storage position = positions[positionId];
        require(position.id > 0, "Position does not exist");
        
        // Liquidation occurs when loss reaches 80% of collateral
        uint256 maxLoss = (position.collateral * LIQUIDATION_THRESHOLD) / 100;
        
        // Calculate price change that would cause max loss
        uint256 priceChange = (maxLoss * position.entryPrice) / (position.size * position.leverage);
        
        if (position.isLong) {
            // For long: liquidation price is below entry
            liquidationPrice = position.entryPrice - priceChange;
        } else {
            // For short: liquidation price is above entry
            liquidationPrice = position.entryPrice + priceChange;
        }
        
        return liquidationPrice;
    }
    
    /**
     * @notice Check if position should be liquidated
     * @param positionId Position ID
     * @return shouldLiquidate Whether position should be liquidated
     */
    function shouldLiquidate(uint256 positionId) public view returns (bool) {
        Position storage position = positions[positionId];
        
        if (!position.isOpen) return false;
        
        uint256 currentPrice = oracle.getLatestPrice(position.pair);
        int256 pnl = calculatePnL(positionId, currentPrice);
        
        // Liquidate if loss exceeds threshold
        int256 maxLoss = -int256((position.collateral * LIQUIDATION_THRESHOLD) / 100);
        
        return pnl <= maxLoss;
    }
    
    /**
     * @notice Liquidate a position
     * @param positionId Position ID to liquidate
     */
    function liquidatePosition(uint256 positionId) external {
        require(shouldLiquidate(positionId), "Position not liquidatable");
        
        Position storage position = positions[positionId];
        uint256 liquidationPrice = oracle.getLatestPrice(position.pair);
        
        position.isOpen = false;
        
        emit PositionLiquidated(positionId, msg.sender, liquidationPrice);
    }
    
    /**
     * @notice Get all positions for a trader
     * @param trader Trader address
     * @return positionIds Array of position IDs
     */
    function getTraderPositions(address trader) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return traderPositions[trader];
    }
    
    /**
     * @notice Get all positions for an agent
     * @param agent Agent address
     * @return positionIds Array of position IDs
     */
    function getAgentPositions(address agent) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return agentPositions[agent];
    }
    
    /**
     * @notice Get position details
     * @param positionId Position ID
     * @return position Position struct
     */
    function getPosition(uint256 positionId) 
        external 
        view 
        returns (Position memory) 
    {
        return positions[positionId];
    }
    
    /**
     * @notice Get current unrealized PnL for a position
     * @param positionId Position ID
     * @return pnl Current unrealized PnL
     */
    function getUnrealizedPnL(uint256 positionId) 
        external 
        view 
        returns (int256 pnl) 
    {
        Position storage position = positions[positionId];
        require(position.isOpen, "Position not open");
        
        uint256 currentPrice = oracle.getLatestPrice(position.pair);
        return calculatePnL(positionId, currentPrice);
    }
}
