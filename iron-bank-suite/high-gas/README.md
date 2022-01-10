# High Gas Agent

## Description

Detects if gas used is > 3M

## Supported Chains

- Ethereum

## Alerts

- IRON-BANK-HIGH-GAS
  - Fired when the gas used is > 3M
  - Severity is always set to "medium"
  - Type is always set to "info"
  - Metadata field:
    - "gasUsed"
