# Bad Debt Agent

## Description

Detects if account has bad debt immediately after it interacts with Iron Bank market

## Supported Chains

- Ethereum

## Alerts

- IRON-BANK-BAD-DEBT
  - Fired when an account has bad debt immediately after it interacts with Iron Bank market
  - Severity is always set to "medium"
  - Type is always set to "degraded"
  - Metadata field:
    - "account" - the account that has bad debt
    - "shortfall" - account shortfall below collateral requirements

## Test Data

`npm test`
