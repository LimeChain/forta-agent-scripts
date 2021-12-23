# Credit Limit Changed Agent

## Description

Detects if credit limit for protocol is changed

## Supported Chains

- Ethereum

## Alerts

- IRON-BANK-CREDIT-LIMIT-CHANGED
  - Fired when the credit limit for protocol is changed
  - Severity is always set to "medium"
  - Type is always set to "info"
  - Metadata field:
    - "protocol"
    - "creditLimit"

## Test Data

The agent behaviour can be verified with the following transaction (3 CreditLimitChanged events):

- 0xb1de5e62e004dc5379e08d872b62446d0a72f9aca8d8457d92fb98eae43e5acb
