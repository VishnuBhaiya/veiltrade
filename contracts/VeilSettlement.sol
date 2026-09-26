// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IEligibility} from "./IEligibility.sol";

/// @notice Functional MVP: compliant atomic DvP settlement on HSK Chain.
/// @dev Trade values are public on-chain in this contract. ConfidentialSettlement.sol is the privacy extension.
contract VeilSettlement is ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum Status { NONE, CREATED, READY, SETTLED, CANCELLED }
    struct Trade {
        address buyer;
        address seller;
        uint256 assetAmount;
        uint256 paymentAmount;
        bytes32 commitment;
        bool buyerApproved;
        bool sellerApproved;
        Status status;
    }

    IERC20 public immutable assetToken;
    IERC20 public immutable paymentToken;
    IEligibility public immutable registry;
    mapping(bytes32 => Trade) public trades;

    event TradeCreated(bytes32 indexed tradeId, address indexed buyer, address indexed seller, bytes32 commitment);
    event TradeApproved(bytes32 indexed tradeId, address indexed party);
    event TradeReady(bytes32 indexed tradeId);
    event TradeSettled(bytes32 indexed tradeId, bytes32 indexed commitment);
    event TradeCancelled(bytes32 indexed tradeId);

    constructor(address asset, address payment, address eligibilityRegistry) {
        assetToken = IERC20(asset);
        paymentToken = IERC20(payment);
        registry = IEligibility(eligibilityRegistry);
    }

    function createTrade(
        bytes32 tradeId,
        address buyer,
        address seller,
        uint256 assetAmount,
        uint256 paymentAmount,
        bytes32 commitment
    ) external {
        require(trades[tradeId].status == Status.NONE, "trade exists");
        require(msg.sender == buyer || msg.sender == seller, "not party");
        require(buyer != seller && buyer != address(0) && seller != address(0), "bad parties");
        require(assetAmount > 0 && paymentAmount > 0, "zero amount");
        require(registry.isEligible(buyer) && registry.isEligible(seller), "ineligible");
        trades[tradeId] = Trade(buyer, seller, assetAmount, paymentAmount, commitment, false, false, Status.CREATED);
        emit TradeCreated(tradeId, buyer, seller, commitment);
    }

    function approveTrade(bytes32 tradeId) external {
        Trade storage t = trades[tradeId];
        require(t.status == Status.CREATED || t.status == Status.READY, "not approvable");
        require(msg.sender == t.buyer || msg.sender == t.seller, "not party");
        if (msg.sender == t.buyer) t.buyerApproved = true;
        if (msg.sender == t.seller) t.sellerApproved = true;
        emit TradeApproved(tradeId, msg.sender);
        if (t.buyerApproved && t.sellerApproved && t.status != Status.READY) {
            t.status = Status.READY;
            emit TradeReady(tradeId);
        }
    }

    function settle(bytes32 tradeId) external nonReentrant {
        Trade storage t = trades[tradeId];
        require(t.status == Status.READY, "not ready");
        require(registry.isEligible(t.buyer) && registry.isEligible(t.seller), "eligibility changed");
        t.status = Status.SETTLED;
        assetToken.safeTransferFrom(t.seller, t.buyer, t.assetAmount);
        paymentToken.safeTransferFrom(t.buyer, t.seller, t.paymentAmount);
        emit TradeSettled(tradeId, t.commitment);
    }

    function cancelTrade(bytes32 tradeId) external {
        Trade storage t = trades[tradeId];
        require(t.status == Status.CREATED, "cannot cancel");
        require(msg.sender == t.buyer || msg.sender == t.seller, "not party");
        t.status = Status.CANCELLED;
        emit TradeCancelled(tradeId);
    }
}
