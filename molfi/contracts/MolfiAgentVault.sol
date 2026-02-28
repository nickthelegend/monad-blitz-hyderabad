// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC4626Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./dex/MolfiPerpDEX.sol";
import "./IdentityRegistryUpgradeable.sol";

/**
 * @title MolfiAgentVault
 * @notice Individual agent vault for user deposits and autonomous AI trading.
 * @dev ERC4626 compliant vault that allows an authorized agent to trade on MolfiPerpDEX.
 */
contract MolfiAgentVault is ERC4626Upgradeable, OwnableUpgradeable, UUPSUpgradeable {
    uint256 public agentId;
    IdentityRegistryUpgradeable public identityRegistry;
    MolfiPerpDEX public perpDEX;
    IERC20 public usdc;

    // Performance fee params
    uint256 public constant PERFORMANCE_FEE_BPS = 1000; // 10%
    uint256 public constant BPS_DENOMINATOR = 10000;
    
    // Tracking realized profit for performance fees
    uint256 public lastCumulativeProfit;

    event TradeExecuted(string pair, uint256 size, bool isLong);
    event PositionClosed(uint256 positionId, int256 pnl);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        uint256 _agentId,
        address _identityRegistry,
        address _perpDEX,
        address _usdc,
        string memory _name,
        string memory _symbol
    ) public initializer {
        __ERC4626_init(IERC20(_usdc));
        __ERC20_init(_name, _symbol);
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();

        agentId = _agentId;
        identityRegistry = IdentityRegistryUpgradeable(_identityRegistry);
        perpDEX = MolfiPerpDEX(_perpDEX);
        usdc = IERC20(_usdc);

        // Approve DEX to spend USDC from vault
        usdc.approve(_perpDEX, type(uint256).max);
    }

    /**
     * @notice Total assets include liquid USDC + unrealized value in Perp DEX
     */
    function totalAssets() public view override returns (uint256) {
        uint256 liquidUsdc = usdc.balanceOf(address(this));
        
        // Sum up collateral and unrealized PnL from all open agent positions
        uint256[] memory positionIds = perpDEX.getAgentPositions(address(this));
        int256 totalUnrealizedPnL = 0;
        uint256 totalCollateral = 0;

        for (uint256 i = 0; i < positionIds.length; i++) {
            MolfiPerpDEX.Position memory pos = perpDEX.getPosition(positionIds[i]);
            if (pos.isOpen) {
                totalCollateral += pos.collateral;
                totalUnrealizedPnL += perpDEX.getUnrealizedPnL(positionIds[i]);
            }
        }

        int256 nav = int256(liquidUsdc) + int256(totalCollateral) + totalUnrealizedPnL;
        return nav > 0 ? uint256(nav) : 0;
    }

    /**
     * @notice Authorized agent (ClawBot) executes a perp trade
     */
    function executePerpTrade(
        string memory pair,
        uint256 size,
        uint256 collateral,
        uint256 leverage,
        bool isLong
    ) external returns (uint256) {
        address authorizedWallet = identityRegistry.getAgentWallet(agentId);
        require(msg.sender == authorizedWallet, "Only authorized agent wallet can execute trades");
        require(collateral <= usdc.balanceOf(address(this)), "Insufficient vault collateral");

        uint256 positionId = perpDEX.openPosition(
            address(this), // agent address is the vault
            pair,
            size,
            collateral,
            leverage,
            isLong
        );

        emit TradeExecuted(pair, size, isLong);
        return positionId;
    }

    /**
     * @notice Close a specific perp position
     */
    function closePerpPosition(uint256 positionId) external {
        address authorizedWallet = identityRegistry.getAgentWallet(agentId);
        require(msg.sender == authorizedWallet, "Only authorized agent wallet can close trades");
        
        MolfiPerpDEX.Position memory pos = perpDEX.getPosition(positionId);
        require(pos.agent == address(this), "Not vault's position");

        int256 pnl = perpDEX.closePosition(positionId);
        
        emit PositionClosed(positionId, pnl);
    }

    /**
     * @notice Admin-only function to payout profits to a user and close their position.
     * @dev This burns ALL of the user's shares in this vault, but only pays out the profit amount.
     * @param user The user address to close position for
     * @param sharesToBurn The total shares to burn (closing position)
     * @param profitAmount The profit amount in USDC to send to the user
     */
    function adminPayoutProfit(address user, uint256 sharesToBurn, uint256 profitAmount) external onlyOwner {
        require(balanceOf(user) >= sharesToBurn, "Insufficient shares");
        _burn(user, sharesToBurn);
        if (profitAmount > 0) {
            usdc.transfer(user, profitAmount);
        }
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}
