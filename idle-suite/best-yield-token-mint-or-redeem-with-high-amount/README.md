# Best Yield Token Mint or Borrow With High Amount

## Description

Detects if there is a mint or redeem of idleToken with high amount

## Supported Chains

- Ethereum

## Alerts

- IDLE-BEST-YIELD-MINT-OR-BORROW-WITH-HIGH-AMOUNT
  - Fired when a transaction mints or redeems high amount of idleTokens
  - Severity is always set to "medium"
  - Type is always set to "info"
  - Metadata:
    - "type" - either "Mint" or "Redeem"
    - "usdAmount" - the amount of idleTokens in USD
