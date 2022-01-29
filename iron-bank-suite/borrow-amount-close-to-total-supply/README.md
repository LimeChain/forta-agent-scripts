# Borrow Amount Close to Total Supply Agent

## Description

Detects if a borrow amount is close to the total supply of the market

## Supported Chains

- Ethereum

## Alerts

- BORROW-AMOUNT-CLOSE-TO-TOTAL-SUPPLY
  - Fired when a borrow amount is close to the total supply of the market
  - Severity is always set to "medium"
  - Type is always set to "info"
  - Metadata field:
    - "borrower" - the account that borrowed from the market
    - "market" - the Iron Bank market
    - "borrowAmount" - the borrowed amount
    - "percentage" - the ratio of the borrowAmount to the totalSupply in percentages
