# Perpetual Yield Tranches Strategy Price Decrease

## Description

Detects if the price of any CDO strategy has decreased

## Supported Chains

- Ethereum

## Alerts

- IDLE-PERPETUAL-YIELD-TRANCHES-STRATEGY-PRICE-DECREASE
  - Fired when the price of any CDO strategy has decreased
  - Severity is always set to "critical"
  - Type is always set to "suspicious"
  - Metadata:
    - "price" - the current price of the strategy
    - "oldPrice" - the old price of the strategy
    - "symbol" - The strategyToken's symbol
