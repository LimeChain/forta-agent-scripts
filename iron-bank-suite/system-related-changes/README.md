# System Related Changes Agent

## Description

Detects if system related contracts or variables are changed

## Supported Chains

- Ethereum

## Alerts

- IRON-BANK-SYSTEM-RELATED-CHANGE
  - Fired when system related contracts or variables are changed
  - Severity is always set to "medium"
  - Type is always set to "info"
  - Metadata field:
    - "address" - the contract's address (either the Comptroller or an Iron Bank market)
    - "name" - the event's name

## Test Data

The agent behaviour can be verified with the following transaction (NewPriceOracle event):

- 0x967a3c2a40903d5b025b0e312f77761eed1bd52b46a994298bf0d4b903097de6
