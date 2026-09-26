// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IEligibility} from "./IEligibility.sol";

contract EligibilityRegistry is Ownable, IEligibility {
    struct Eligibility { bool approved; uint8 level; uint64 validUntil; }
    mapping(address => Eligibility) public eligibility;

    event EligibilityUpdated(address indexed account, bool approved, uint8 level, uint64 validUntil);

    constructor(address initialOwner) Ownable(initialOwner) {}

    function setEligibility(address account, bool approved, uint8 level, uint64 validUntil) external onlyOwner {
        eligibility[account] = Eligibility(approved, level, validUntil);
        emit EligibilityUpdated(account, approved, level, validUntil);
    }

    function isEligible(address account) public view override returns (bool) {
        Eligibility memory e = eligibility[account];
        return e.approved && (e.validUntil == 0 || e.validUntil >= block.timestamp);
    }
}
