# VeilTrade portfolio overview

## Implementation

The project combines wallet sessions, isolated market order books, exact order matching, selective disclosure, a demo portfolio and a Solidity delivery-versus-payment path. The repository is maintained by Vishnu Bhaiya as part of Team VeilForge; the team prototype should not be presented as sole-authored work without a contribution breakdown.

## Demonstration boundaries

Application-level confidentiality and redacted public API views are separate from on-chain privacy. Ordinary ERC-20 settlement transfers remain public. The Noir circuit and shielded-settlement extension are not evidence of a production zero-knowledge system; `DemoVerifier.sol` is development-only. Sandbox inventory is not a real financial holding.

The README's deployment link is a demonstration endpoint, not an assurance that a particular network, contract deployment, wallet or external service is currently available. No real-asset trade or blockchain transaction is executed as part of a repository documentation update.

## Reproduction

Follow the existing README and `.env.example`; use your own service configuration and test wallets. The Supabase publishable key is intentionally public client configuration, not a service-role credential. Never add service-role secrets or wallet private keys to tracked files.

Application builds and contract tests require the documented Node/dependency environment. The contracts and cryptographic extensions require their own security review before any production use. This update improves documentation and repository metadata; it does not change the running cloud application or claim a financial/security audit.
