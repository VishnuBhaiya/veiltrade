// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IEligibility {
    function isEligible(address account) external view returns (bool);
}
