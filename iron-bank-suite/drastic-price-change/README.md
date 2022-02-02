# Drastic Price Change Agent

## Description

Detects if the price of the underlying asset of an Iron Bank market changes drastically

## Supported Chains

- Ethereum

## Alerts

- IRON-BANK-DRASTIC-PRICE-CHANGE
  - Fired when the price of the underlying asset of an Iron Bank market changes drastically (More than 30% for 1 hour)
  - Severity is always set to "medium"
  - Type is always set to "info"
  - Metadata field:
    - "market" - the Iron Bank market
    - "oldPrice" - the price before the interval time
    - "price" - the current price
    - "percentage" - the percentage diff of the prices
