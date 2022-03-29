# Perpetual Yield Tranches Large Change in Contract Value

## Description

Detects if the contract value of CDO changes drastically

## Supported Chains

- Ethereum

## Alerts

- IDLE-PERPETUAL-YIELD-TRANCHES-DRASTIC-CHANGE-IN-CONTRACT-VALUE
  - Fired when the contract value of CDO changes drastically
  - Severity is always set to "medium"
  - Type is always set to "info"
  - Metadata:
    - "value" - the current contract value
    - "oldValue" - the old contract value
    - "cdo" - the cdo's symbol
