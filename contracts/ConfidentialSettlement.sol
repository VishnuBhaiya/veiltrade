// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IZKVerifier {
    function verify(bytes calldata proof, bytes32[] calldata publicInputs) external view returns (bool);
}

/// @notice Privacy architecture for VeilTrade.
/// @dev Uses shielded commitments/nullifiers and a pluggable ZK verifier generated from the circuit.
///      Deposits/withdrawals are public; transfers between shielded notes reveal only commitments/nullifiers.
contract ConfidentialSettlement is ReentrancyGuard {
    using SafeERC20 for IERC20;

    IZKVerifier public immutable verifier;
    mapping(bytes32 => bool) public commitments;
    mapping(bytes32 => bool) public nullifiers;

    event Deposited(address indexed token, address indexed from, uint256 amount, bytes32 indexed commitment);
    event PrivateSettlement(bytes32 indexed auditCommitment, bytes32[] nullifiers, bytes32[] newCommitments);
    event Withdrawn(address indexed token, address indexed to, uint256 amount, bytes32 indexed nullifier);

    constructor(address verifierAddress) { verifier = IZKVerifier(verifierAddress); }

    function deposit(address token, uint256 amount, bytes32 commitment) external nonReentrant {
        require(!commitments[commitment], "commitment exists");
        require(amount > 0, "zero amount");
        commitments[commitment] = true;
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        emit Deposited(token, msg.sender, amount, commitment);
    }

    function privateSettle(
        bytes calldata proof,
        bytes32[] calldata publicInputs,
        bytes32[] calldata spentNullifiers,
        bytes32[] calldata newCommitments,
        bytes32 auditCommitment
    ) external {
        require(verifier.verify(proof, publicInputs), "invalid proof");
        require(spentNullifiers.length > 0 && newCommitments.length > 0, "empty transition");
        for (uint256 i = 0; i < spentNullifiers.length; i++) {
            require(!nullifiers[spentNullifiers[i]], "double spend");
            nullifiers[spentNullifiers[i]] = true;
        }
        for (uint256 i = 0; i < newCommitments.length; i++) {
            require(!commitments[newCommitments[i]], "duplicate commitment");
            commitments[newCommitments[i]] = true;
        }
        emit PrivateSettlement(auditCommitment, spentNullifiers, newCommitments);
    }

    function withdraw(
        address token,
        address to,
        uint256 amount,
        bytes calldata proof,
        bytes32[] calldata publicInputs,
        bytes32 nullifier
    ) external nonReentrant {
        require(!nullifiers[nullifier], "already spent");
        require(verifier.verify(proof, publicInputs), "invalid proof");
        nullifiers[nullifier] = true;
        IERC20(token).safeTransfer(to, amount);
        emit Withdrawn(token, to, amount, nullifier);
    }
}
