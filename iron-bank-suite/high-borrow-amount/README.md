# High Borrow Amount Agent

## Description

Detects if there is a borrow with high borrow amount

## Supported Chains

- Ethereum

## Alerts

- IRON-BANK-HIGH-BORROW-AMOUNT
  - Fired when there is a borrow with high borrow amount
  - Severity is always set to "medium"
  - Type is always set to "info"
  - Metadata field:
    - "borrower" - the account that borrowed tokens
    - "amount" - the amount in USD
    - "market" - the Iron Bank market
