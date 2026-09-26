// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {MockUSDC} from "./MockUSDC.sol";
import {MockRWA} from "./MockRWA.sol";
import {EligibilityRegistry} from "./EligibilityRegistry.sol";
import {VeilSettlement} from "./VeilSettlement.sol";

/// @notice Hackathon-only one-transaction bootstrap for the vTBILL HSK testnet path.
/// @dev Keeps ownership inside this helper so any demo wallet can self-provision test assets + eligibility.
contract VeilDemoBootstrap {
    address public immutable admin;
    MockUSDC public immutable usdc;
    MockRWA public immutable rwa;
    EligibilityRegistry public immutable registry;
    VeilSettlement public immutable settlement;

    mapping(address => bool) public claimed;

    event DemoWalletProvisioned(address indexed wallet, uint256 usdcAmount, uint256 rwaAmount);

    constructor() {
        admin = msg.sender;
        usdc = new MockUSDC(address(this));
        rwa = new MockRWA(address(this));
        registry = new EligibilityRegistry(address(this));
        settlement = new VeilSettlement(address(rwa), address(usdc), address(registry));

        _provision(msg.sender);
    }

    function claimDemoAssets() external {
        require(!claimed[msg.sender], "already claimed");
        _provision(msg.sender);
    }

    function setEligibility(address account, bool approved, uint8 level, uint64 validUntil) external {
        require(msg.sender == admin, "admin only");
        registry.setEligibility(account, approved, level, validUntil);
    }

    function adminMint(address account, uint256 usdcAmount, uint256 rwaAmount) external {
        require(msg.sender == admin, "admin only");
        if (usdcAmount > 0) usdc.mint(account, usdcAmount);
        if (rwaAmount > 0) rwa.mint(account, rwaAmount);
    }

    function _provision(address account) internal {
        uint256 usdcAmount = 1_000_000 * 10 ** 6;
        uint256 rwaAmount = 100_000 * 10 ** 18;
        registry.setEligibility(account, true, 3, type(uint64).max);
        usdc.mint(account, usdcAmount);
        rwa.mint(account, rwaAmount);
        claimed[account] = true;
        emit DemoWalletProvisioned(account, usdcAmount, rwaAmount);
    }
}
