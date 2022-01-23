# High Mint or Borrow Amount Agent

## Description

Detects if there is a mint or borrow with high borrow amount

## Supported Chains

- Ethereum

## Alerts

- IRON-BANK-HIGH-BORROW-AMOUNT
  - Fired when there is a borrow with high amount
  - Severity is always set to "medium"
  - Type is always set to "info"
  - Metadata field:
    - "account" - the account that borrowed tokens
    - "amount" - the amount in USD
    - "market" - the Iron Bank market
- IRON-BANK-HIGH-MINT-AMOUNT
  - Fired when there is a mint with high amount
  - Severity is always set to "medium"
  - Type is always set to "info"
  - Metadata field:
    - "account" - the account that minted tokens
    - "amount" - the amount in USD
    - "market" - the Iron Bank market
