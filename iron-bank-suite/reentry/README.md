# Reentry Agent

## Description

Detects if there are nested borrows.
Tested with CREAM AMP exploit transaction which contains nested borrows.
The addresses of the CREAM markets are changed to Iron Bank markets because we filter out all other addresses.

## Supported Chains

- Ethereum

## Alerts

- IRON-BANK-REENTRY
  - Fired when nested borrows are detected
  - Severity is always set to "critical"
  - Type is always set to "exploit"

