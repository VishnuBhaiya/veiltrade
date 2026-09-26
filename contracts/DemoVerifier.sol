// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IZKVerifier} from "./ConfidentialSettlement.sol";

/// @notice DEMO ONLY. This is intentionally not a cryptographic verifier.
/// Replace with the verifier generated from the Noir circuit before production use.
contract DemoVerifier is IZKVerifier {
    bool public acceptProofs = true;
    function setAcceptProofs(bool value) external { acceptProofs = value; }
    function verify(bytes calldata proof, bytes32[] calldata) external view returns (bool) {
        return acceptProofs && proof.length > 0;
    }
}
