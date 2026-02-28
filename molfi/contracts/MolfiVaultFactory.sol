// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "./MolfiAgentVault.sol";

contract MolfiVaultFactory {
    address public immutable implementation;
    address public immutable identityRegistry;
    address public immutable perpDEX;
    address public immutable usdc;

    event VaultDeployed(uint256 indexed agentId, address vaultAddress);

    constructor(
        address _implementation,
        address _identityRegistry,
        address _perpDEX,
        address _usdc
    ) {
        implementation = _implementation;
        identityRegistry = _identityRegistry;
        perpDEX = _perpDEX;
        usdc = _usdc;
    }

    /**
     * @notice Deploy a new vault for an agent and link it in the registry
     */
    function deployVault(uint256 agentId, string memory name, string memory symbol) external returns (address) {
        bytes memory data = abi.encodeWithSelector(
            MolfiAgentVault.initialize.selector,
            agentId,
            identityRegistry,
            perpDEX,
            usdc,
            name,
            symbol
        );

        ERC1967Proxy proxy = new ERC1967Proxy(implementation, data);
        address vaultAddress = address(proxy);

        // Transfer ownership of the vault to the caller (deployer) so they can upgrade it later
        MolfiAgentVault(vaultAddress).transferOwnership(msg.sender);

        emit VaultDeployed(agentId, vaultAddress);
        return vaultAddress;
    }
}
