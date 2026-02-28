// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MolfiAgentValidator
 * @notice Custom validator for Molfi AI agents
 * @dev Validates agent metadata and requirements for the Molfi protocol
 */
contract MolfiAgentValidator {
    // Validation score constants
    uint8 public constant MAX_SCORE = 100;
    uint8 public constant MIN_SCORE = 0;
    
    // Validation criteria weights
    uint8 public constant WEIGHT_NAME = 20;
    uint8 public constant WEIGHT_DESCRIPTION = 20;
    uint8 public constant WEIGHT_STRATEGY = 30;
    uint8 public constant WEIGHT_WALLET = 15;
    uint8 public constant WEIGHT_METADATA = 15;
    
    // Events
    event ValidationRequested(address indexed requester, uint256 indexed agentId);
    event ValidationCompleted(uint256 indexed agentId, uint8 score, string status);
    
    /**
     * @notice Validate an agent's metadata
     * @param agentURI The IPFS URI of the agent metadata
     * @return score Validation score (0-100)
     * @return isValid Whether the agent meets minimum requirements
     * @return message Validation result message
     */
    function validateAgent(
        string memory agentURI
    ) external pure returns (
        uint8 score,
        bool isValid,
        string memory message
    ) {
        // Basic URI validation
        if (bytes(agentURI).length == 0) {
            return (0, false, "Agent URI is empty");
        }
        
        // Check if URI starts with ipfs://
        if (!_startsWith(agentURI, "ipfs://")) {
            return (50, false, "Agent URI must start with ipfs://");
        }
        
        // If we get here, basic validation passed
        // In a real implementation, we would fetch and parse the metadata
        // For now, we'll return a base score
        score = 70; // Base score for valid URI
        isValid = true;
        message = "Agent metadata URI is valid";
        
        return (score, isValid, message);
    }
    
    /**
     * @notice Validate agent metadata structure
     * @param name Agent name
     * @param description Agent description
     * @param hasStrategy Whether agent has strategy defined
     * @param hasWallet Whether agent has wallet verified
     * @return score Validation score (0-100)
     */
    function validateMetadata(
        string memory name,
        string memory description,
        bool hasStrategy,
        bool hasWallet
    ) external pure returns (uint8 score) {
        score = 0;
        
        // Validate name (20 points)
        if (bytes(name).length >= 3 && bytes(name).length <= 50) {
            score += WEIGHT_NAME;
        } else if (bytes(name).length > 0) {
            score += WEIGHT_NAME / 2; // Partial credit
        }
        
        // Validate description (20 points)
        if (bytes(description).length >= 10 && bytes(description).length <= 500) {
            score += WEIGHT_DESCRIPTION;
        } else if (bytes(description).length > 0) {
            score += WEIGHT_DESCRIPTION / 2; // Partial credit
        }
        
        // Validate strategy (30 points)
        if (hasStrategy) {
            score += WEIGHT_STRATEGY;
        }
        
        // Validate wallet (15 points)
        if (hasWallet) {
            score += WEIGHT_WALLET;
        }
        
        // Metadata completeness (15 points) - assumed complete if all above are valid
        if (score >= 85) {
            score += WEIGHT_METADATA;
        }
        
        return score;
    }
    
    /**
     * @notice Check if agent meets minimum requirements
     * @param score Validation score
     * @return isValid Whether agent meets minimum requirements
     */
    function meetsMinimumRequirements(uint8 score) external pure returns (bool isValid) {
        return score >= 60; // Minimum 60% score required
    }
    
    /**
     * @notice Get validation status message
     * @param score Validation score
     * @return status Status message
     */
    function getValidationStatus(uint8 score) external pure returns (string memory status) {
        if (score >= 90) {
            return "Excellent - Highly trusted agent";
        } else if (score >= 75) {
            return "Good - Trusted agent";
        } else if (score >= 60) {
            return "Acceptable - Meets minimum requirements";
        } else if (score >= 40) {
            return "Poor - Missing key information";
        } else {
            return "Failed - Does not meet requirements";
        }
    }
    
    /**
     * @notice Helper function to check if string starts with prefix
     * @param str String to check
     * @param prefix Prefix to look for
     * @return bool Whether string starts with prefix
     */
    function _startsWith(string memory str, string memory prefix) private pure returns (bool) {
        bytes memory strBytes = bytes(str);
        bytes memory prefixBytes = bytes(prefix);
        
        if (strBytes.length < prefixBytes.length) {
            return false;
        }
        
        for (uint i = 0; i < prefixBytes.length; i++) {
            if (strBytes[i] != prefixBytes[i]) {
                return false;
            }
        }
        
        return true;
    }
}
