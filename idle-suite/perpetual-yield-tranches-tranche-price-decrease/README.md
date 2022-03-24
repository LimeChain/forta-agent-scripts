# Perpetual Yield Tranches Tranche Price Decrease

## Description

Detects if the tranchePrice of any tranche has decreased

## Supported Chains

- Ethereum

## Alerts

- IDLE-PERPETUAL-YIELD-TRANCHES-TRANCHE-PRICE-DECREASE
  - Fired when the tranchePrice of any tranche has decreased
  - Severity is always set to "critical"
  - Type is always set to "suspicious"
  - Metadata:
    - "price" - the current price of the token
    - "oldPrice" - the old price of the token
    - "trancheType" - "AA" for senior tranches and "BB" for junior tranches
    - "symbol" - the strategyToken's symbol
