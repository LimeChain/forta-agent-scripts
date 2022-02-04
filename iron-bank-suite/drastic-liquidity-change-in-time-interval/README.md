# Drastic Price Change Agent

## Description

Detects if an Iron Bank liquidity (cash or total borrows) change drastically for a time period

## Supported Chains

- Ethereum

## Alerts

- IRON-BANK-DRASTIC-LIQUIDITY-CHANGE-FOR-TIME-PERIOD
  - Fired when an Iron Bank liquidity (cash or total borrows) change drastically for a time period (More than 50% in the last 10 minutes)
  - Severity is always set to "medium"
  - Type is always set to "info"
  - Metadata field:
    - "market" - the Iron Bank market
    - "percentage" - the percentage diff of the prices
    - "type" - either "cash" or "total borrows"
