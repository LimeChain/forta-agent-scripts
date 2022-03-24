# Perpetual Yield Tranches Virtual Price Decrease

## Description

Detects if the virtualPrice of any tranche has decreased

## Supported Chains

- Ethereum

## Alerts

- IDLE-PERPETUAL-YIELD-TRANCHES-VIRTUAL-PRICE-DECREASE
  - Fired when the virtualPrice of any tranche has decreased
  - Severity is always set to "critical"
  - Type is always set to "suspicious"
  - Metadata:
    - "price" - the current price of the token
    - "oldPrice" - the old price of the token
    - "trancheType" - "AA" for senior tranches and "BB" for junior tranches
    - "symbol" - the strategyTokens's symbol
