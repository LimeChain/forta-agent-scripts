# Drastic Liquidity Change Agent

## Description

Detects if the market's liquidity (cashPrior or totalBorrows) changes drastically

## Supported Chains

- Ethereum

## Alerts

- IRON-BANK-DRASTIC-LIQUIDITY-CHANGE
  - Fired when the market's liquidity (cashPrior or totalBorrows) changes drastically
  - Severity is always set to "medium"
  - Type is always set to "suspicious"
  - Metadata field:
    - "address" - the market's address
    - "percentage" - the percentage difference
    - "type" - either "cashPrior" or "totalBorrows"

## Test Data

The agent behaviour can be verified by running:

`npm run tx 0x61564378bb62f6690ba8b716346597348e3758b132fe0ccc1ab419b3c209e770,0x6f05917f423d59dfbe74b82b9f4f982f18aa5632a9acafd49a83f34234f60cc1`
