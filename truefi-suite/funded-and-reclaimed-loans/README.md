# TrueFi Funded and Reclaimed Loans

## Description

Detects if a TrueFi loan is funded or reclaimed

## Supported Chains

- Ethereum

## Alerts

- TRUEFI-LOAN-FUNDED
  - Fired when a loan is funded
  - Severity is always set to "high"
  - Type is always set to "info"
  - Metadata:
    - "loanToken"
    - "amount"

- TRUEFI-LOAN-RECLAIMED
  - Fired when a loan is reclaimed
  - Severity is always set to "high"
  - Type is always set to "info"
  - Metadata:
    - "loanToken"
    - "amount"

## Test Data

The agent behaviour can be verified with the following transactions:

- 0x1dffd9cd3de6096d885d44ffa1536d439ab490c8bd52def28b7e4b8c8f1f5f11 (Funded loan)
- 0x66ee7957411e0674c5e166e0aae3f9a3536b913f55decba21ff17c4beffca4ac (Reclaimed loan)
