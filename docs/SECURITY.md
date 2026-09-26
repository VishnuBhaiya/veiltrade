# VeilTrade Threat Model

## What the hackathon MVP protects

- Wallet login cannot be forged without a valid wallet signature.
- API sessions use HTTP-only signed cookies.
- Order payloads are encrypted at rest when persisted by the server.
- Public APIs redact counterparties and amounts.
- Trade commitments make silent order mutation detectable.
- Eligibility is re-checked at settlement time.
- `VeilSettlement` uses atomic transfers and reentrancy protection.
- Trade IDs cannot be settled twice.
- Shielded contract nullifiers prevent note reuse when a real verifier is connected.

## What the hackathon MVP does NOT claim

- The public ERC-20 DvP contract does not hide settlement amounts/addresses from blockchain observers.
- The server-based matcher can see plaintext order terms in the MVP.
- `DemoVerifier.sol` is not zero-knowledge and must never be treated as secure.
- Demo admin/regulator keys are not production IAM.
- Mock RWA / mock USDC have no real-world value.

## Production requirements

- Audited generated ZK verifier and circuits
- HSM/MPC-backed key management
- TEE/MPC/FHE or ZK matching engine
- Rate limiting, CSRF controls, replay protections and full SIWE compliance
- Smart-contract audit / formal verification
- Real KYC/KYB and sanctions screening integration
- Custody, legal asset-transfer and RWA issuer controls
- Monitoring, incident response and tamper-evident audit logs
