// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IEligibility} from "./IEligibility.sol";

interface IHSKKycSBT {
    function isHuman(address account) external view returns (bool isValid, uint8 level);
}

/// @notice Adapter for HSK Chain's KYC SBT interface documented by HSK Chain.
/// @dev Pass the network-specific KYC SBT address when known/provisioned by the HSK environment.
contract HSKKycEligibilityAdapter is IEligibility {
    IHSKKycSBT public immutable kycSBT;
    uint8 public immutable minimumLevel;

    constructor(address kycSbtAddress, uint8 minLevel) {
        require(kycSbtAddress != address(0), "zero KYC address");
        kycSBT = IHSKKycSBT(kycSbtAddress);
        minimumLevel = minLevel;
    }

    function isEligible(address account) external view returns (bool) {
        (bool valid, uint8 level) = kycSBT.isHuman(account);
        return valid && level >= minimumLevel;
    }
}
