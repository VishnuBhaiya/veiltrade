# VeilTrade Noir circuit

This circuit is intentionally small enough to explain in a three-minute hackathon demo. It proves that both counterparties are eligible and that the seller/buyer privately possess sufficient asset/cash balances for the proposed trade.

The generated verifier is designed to plug into `ConfidentialSettlement.sol`. The next iteration binds private values to Poseidon commitments, enforces conservation across old/new shielded notes, and exposes nullifiers as public inputs to prevent double-spends.

Do not present `DemoVerifier.sol` as cryptographic security; it is only a development adapter while the generated verifier is being wired in.
