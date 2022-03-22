# Perpetual Yield Tranches Virtual Price Decrease

## Description

Detects if the virtualPrice of any tranche has decreased

## Supported Chains

- Ethereum

## Alerts

- IDLE-PERPETUAL-YIELD-TRANCHES-VIRTUAL-PRICE-DECREASE
  - Fired when a the virtualPrice of any tranche has decreased
  - Severity is always set to "medium"
  - Type is always set to "info"
  - Metadata:
    - "price" - the current price of the token
    - "oldPrice" - the old price of the token
    - "trancheType" - "AA" for senior tranches and "BB" for junior tranches
