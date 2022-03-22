# Perpetual Yield Tranches Tranche Price Decrease

## Description

Detects if the tranchePrice of any tranche has decreased

## Supported Chains

- Ethereum

## Alerts

- IDLE-PERPETUAL-YIELD-TRANCHES-TRANCHE-PRICE-DECREASE
  - Fired when a the tranchePrice of any tranche has decreased
  - Severity is always set to "medium"
  - Type is always set to "info"
  - Metadata:
    - "price" - the current price of the token
    - "oldPrice" - the old price of the token
    - "trancheType" - "AA" for senior tranches and "BB" for junior tranches
