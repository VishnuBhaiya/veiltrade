# Three-minute VeilTrade demo

## 0:00–0:25 — Hook

“Public blockchains are transparent. That is powerful for verification, but dangerous for institutional strategy. A fund should not have to broadcast a multi-million-dollar position just to receive atomic settlement.”

## 0:25–0:45 — Product

“VeilTrade separates what the blockchain must verify from what the market is allowed to see. We combine confidential order commitments, compliance controls, price-time matching and atomic RWA-versus-stablecoin settlement on HSK Chain.”

## 0:45–1:25 — Order book

Open `/app`.

- Show institutional BUY/SELL intents.
- Point out that wallet identities are not in the market view.
- Place one private order.
- Run matching engine.
- Show new settlement entry: proof/commitment visible; counterparties and amount are PRIVATE.

## 1:25–1:50 — Regulator reveal

Open `/regulator`.

“Privacy is not the same as hiding from regulators.”

Authorize the regulator view and reveal buyer, seller, quantity and payment for the same commitment.

## 1:50–2:35 — HSK atomic settlement

Open `/settlement`.

Show:

- token allowance
- matched trade anchoring
- two-party approvals
- atomic DvP execution
- real HSK testnet transaction link

“Either the RWA and stablecoin both move, or neither moves.”

## 2:35–3:00 — Technical innovation / close

Show architecture card / repository.

“Our functional HSK contract is the fallback-safe MVP. The privacy extension uses commitments, nullifiers and a pluggable Noir verifier so a production trade can be verified without publishing the underlying terms. VeilTrade gives institutions confidentiality from competitors, verifiability from HSK, and selective accountability for regulators.”

Close: **“The blockchain verifies the trade without seeing the trade.”**
