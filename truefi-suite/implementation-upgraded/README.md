# TrueFi Implementation Upgraded

## Description

Detects if an implementation of a TrueFi contract is upgraded

## Supported Chains

- Ethereum

## Alerts

- TRUEFI-CONTRACT-IMPLEMENTATION-UPGRADED
  - Fired when an implementation of a TrueFi contract is upgraded
  - Severity is always set to "high"
  - Type is always set to "info"
  - Metadata:
    - "contract" - the contract's name
    - "address" - the contract's proxy address
    - "newImplementation" - the new implementation address

- TRUEFI-POOL-IMPLEMENTATION-UPGRADED
  - Fired when an implementation of a TrueFi pool is upgraded
  - Severity is always set to "high"
  - Type is always set to "info"
  - Metadata:
    - "name" - the pool's name
    - "address" - the pool's proxy address
    - "newImplementation" - the new implementation address

## Test Data

The agent behaviour can be verified with the following transactions:

- 0x0f15451fe3fd2bf1cdaa13cd468dbf24ca7ccaebb107f73c7bb3de0235b9eadc (Implementation upgraded for Lender)
- 0xae8cb9fbe34507838fe9e123f7ec3e0f3edade8ca63a8b04964450e7ddc7010f (Implementation upgraded for Pool Factory)
- 0x31d6185aae4e6ebe3f3e76d45df2b92956f30ef9f68a9b7c3d02215449a09c18 (Implementation upgraded for SAFU)
- 0x8e05f5693c477b40be447aa91326f9379a51cc7e208cba069fb69c848fe1d34f (Implementation upgraded for Loan Factory)
