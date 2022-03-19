# Best Yield Token Price Decrease

## Description

Detects if the tokenPrice of any IDLE token has decreased

## Supported Chains

- Ethereum

## Alerts

- IDLE-BEST-YIELD-TOKEN-PRICE-DECREASE
  - Fired when a the tokenPrice of any IDLE token has decreased
  - Severity is always set to "medium"
  - Type is always set to "info"
  - Metadata:
    - "price" - the current price of the token
    - "oldPrice" - the old price of the token
