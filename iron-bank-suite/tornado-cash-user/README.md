# Tornado Cash User Agent

## Description

Detects if account interacting with Iron Bank market has withdrawn from Tornado.cash pool

## Supported Chains

- Ethereum

## Alerts

- IRON-BANK-TORNADO-CASH-USER
  - Fired when an account interacting with Iron Bank market has withdrawn from Tornado.cash pool
  - Severity is always set to "medium"
  - Type is always set to "suspicious"
  - Metadata field:
    - "account" - the account that has bad debt
    - "tornadoCashTxIds" - the Tornado.cash transaction of the account

## Test Data

`npm test`
