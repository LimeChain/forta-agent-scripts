# Best Yield Token Mint or Borrow With Flashloan

## Description

Detects if there is a mint or redeem of idleToken in the same transaction as a flashloan

## Supported Chains

- Ethereum

## Alerts

- IDLE-BEST-YIELD-MINT-OR-BORROW-WITH-FLASHLOAN
  - Fired when a transaction contains mints or redeems of idleTokens and a flashloan
  - Severity is always set to "medium"
  - Type is always set to "info"
  - Metadata:
    - "interactions" - an array of interaction objects. Contains "type" ("Mint" or "Redeem") and the symbol of the idleToken
    - "protocols" - an array of protocol names from which a flashloan has been taken
