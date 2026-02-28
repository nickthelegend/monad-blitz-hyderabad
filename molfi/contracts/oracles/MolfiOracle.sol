// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MolfiOracle
 * @notice Custom price oracle for MolFi — fed by an off-chain bot
 * @dev Replaces Chainlink on testnets where Chainlink feeds don't exist.
 *
 * Architecture: Binance API → Bot → updatePrice() → on-chain storage
 * This is exactly how early GMX/Drift/Synthetix tested their perp DEXs.
 *
 * The contract exposes the same getLatestPrice(string) interface as
 * ChainlinkOracle.sol so MolfiPerpDEX works with zero changes.
 */
contract MolfiOracle {
    // ── Storage ──────────────────────────────────────────────────────
    struct PriceData {
        uint256 price;       // Price in 18 decimals (e.g. 97000e18 for BTC)
        uint256 updatedAt;   // Block timestamp of last update
        uint8   decimals;    // Always 18 for our oracle
    }

    mapping(string => PriceData) public prices;
    string[] public supportedPairs;
    mapping(string => bool) public pairExists;

    // ── Access Control ───────────────────────────────────────────────
    address public owner;
    mapping(address => bool) public updaters;   // Addresses allowed to push prices

    // ── Safety Limits ────────────────────────────────────────────────
    uint256 public maxDeviation = 1000;         // 10% max price jump (basis points)
    uint256 public constant STALENESS = 5 minutes;

    // ── Events ───────────────────────────────────────────────────────
    event PriceUpdated(string indexed pair, uint256 price, uint256 timestamp);
    event UpdaterSet(address indexed updater, bool allowed);
    event PairAdded(string pair);

    // ── Modifiers ────────────────────────────────────────────────────
    modifier onlyOwner() {
        require(msg.sender == owner, "MolfiOracle: not owner");
        _;
    }

    modifier onlyUpdater() {
        require(updaters[msg.sender] || msg.sender == owner, "MolfiOracle: not updater");
        _;
    }

    // ── Constructor ──────────────────────────────────────────────────
    constructor() {
        owner = msg.sender;
        updaters[msg.sender] = true;
    }

    // ── Admin Functions ──────────────────────────────────────────────

    function setUpdater(address _updater, bool _allowed) external onlyOwner {
        updaters[_updater] = _allowed;
        emit UpdaterSet(_updater, _allowed);
    }

    function setMaxDeviation(uint256 _bps) external onlyOwner {
        require(_bps > 0 && _bps <= 5000, "MolfiOracle: invalid deviation");
        maxDeviation = _bps;
    }

    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "MolfiOracle: zero address");
        owner = _newOwner;
    }

    // ── Price Update (called by bot) ─────────────────────────────────

    /**
     * @notice Update a single pair's price
     * @param pair  e.g. "BTC/USD"
     * @param price Price in 18 decimals
     */
    function updatePrice(string calldata pair, uint256 price) external onlyUpdater {
        require(price > 0, "MolfiOracle: zero price");

        PriceData storage pd = prices[pair];

        // Sanity check: if we have a previous price, reject wild jumps
        if (pd.price > 0) {
            uint256 diff = price > pd.price ? price - pd.price : pd.price - price;
            uint256 maxDiff = (pd.price * maxDeviation) / 10000;
            require(diff <= maxDiff, "MolfiOracle: price deviation too large");
        }

        // Register pair if new
        if (!pairExists[pair]) {
            supportedPairs.push(pair);
            pairExists[pair] = true;
            emit PairAdded(pair);
        }

        pd.price = price;
        pd.updatedAt = block.timestamp;
        pd.decimals = 18;

        emit PriceUpdated(pair, price, block.timestamp);
    }

    /**
     * @notice Batch update multiple pairs at once (saves gas)
     * @param pairs  Array of pair names
     * @param _prices Array of prices in 18 decimals
     */
    function updatePrices(string[] calldata pairs, uint256[] calldata _prices) external onlyUpdater {
        require(pairs.length == _prices.length, "MolfiOracle: length mismatch");

        for (uint256 i = 0; i < pairs.length; i++) {
            require(_prices[i] > 0, "MolfiOracle: zero price");

            PriceData storage pd = prices[pairs[i]];

            if (pd.price > 0) {
                uint256 diff = _prices[i] > pd.price ? _prices[i] - pd.price : pd.price - _prices[i];
                uint256 maxDiff = (pd.price * maxDeviation) / 10000;
                require(diff <= maxDiff, "MolfiOracle: price deviation too large");
            }

            if (!pairExists[pairs[i]]) {
                supportedPairs.push(pairs[i]);
                pairExists[pairs[i]] = true;
                emit PairAdded(pairs[i]);
            }

            pd.price = _prices[i];
            pd.updatedAt = block.timestamp;
            pd.decimals = 18;

            emit PriceUpdated(pairs[i], _prices[i], block.timestamp);
        }
    }

    // ── Price Read (used by PerpDEX + frontend) ──────────────────────

    /**
     * @notice Get latest price for a pair — SAME INTERFACE as ChainlinkOracle
     * @param pair Trading pair (e.g. "BTC/USD")
     * @return price Price in 18 decimals
     */
    function getLatestPrice(string memory pair) public view returns (uint256) {
        PriceData storage pd = prices[pair];
        require(pd.price > 0, "MolfiOracle: price not set");
        require(pd.updatedAt > block.timestamp - STALENESS, "MolfiOracle: stale price");
        return pd.price;
    }

    /**
     * @notice Get price with metadata
     * @return price      Price in 18 decimals
     * @return timestamp  Last update time
     * @return roundId    Always 0 (we don't use rounds)
     */
    function getPriceWithMetadata(string memory pair)
        external
        view
        returns (uint256 price, uint256 timestamp, uint80 roundId)
    {
        PriceData storage pd = prices[pair];
        require(pd.price > 0, "MolfiOracle: price not set");
        return (pd.price, pd.updatedAt, 0);
    }

    /**
     * @notice Get price without staleness check (for UI display)
     */
    function getPriceUnsafe(string memory pair)
        external
        view
        returns (uint256 price, uint256 updatedAt, bool isStale)
    {
        PriceData storage pd = prices[pair];
        return (pd.price, pd.updatedAt, block.timestamp - pd.updatedAt > STALENESS);
    }

    /**
     * @notice Get all supported pairs and their prices
     */
    function getAllPrices()
        external
        view
        returns (string[] memory pairs, uint256[] memory _prices, uint256[] memory timestamps)
    {
        uint256 len = supportedPairs.length;
        pairs = new string[](len);
        _prices = new uint256[](len);
        timestamps = new uint256[](len);

        for (uint256 i = 0; i < len; i++) {
            pairs[i] = supportedPairs[i];
            _prices[i] = prices[supportedPairs[i]].price;
            timestamps[i] = prices[supportedPairs[i]].updatedAt;
        }
    }

    function getSupportedPairsCount() external view returns (uint256) {
        return supportedPairs.length;
    }

    function getDecimals(string memory) external pure returns (uint8) {
        return 18;
    }

    function hasPriceFeed(string memory pair) external view returns (bool) {
        return pairExists[pair];
    }
}
