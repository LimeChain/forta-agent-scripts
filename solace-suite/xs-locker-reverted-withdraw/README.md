# Solace xsLocker Reverted Withdraw

## Description

Detects if there is an attempt to withdraw from a locked lock

## Supported Chains

- Ethereum
- Polygon

## Alerts

- SOLACE-XS-LOCKER-REVERTED-WITHDRAW
  - Fired when there is an attepmt to withdraw from a locked lock
  - Severity is always set to "medium"
  - Type is always set to "info"
  - Metadata:
    - "from" - The address interacting with the xsLocker contract
