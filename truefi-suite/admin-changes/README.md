# TrueFi Admin Changes

## Description

Detects if an admin event is emitted

## Supported Chains

- Ethereum

## Alerts

- TRUEFI-ADMIN-CHANGES
  - Fired when an admin event is emitted
  - Severity is always set to "high"
  - Type is always set to "info"
  - Metadata:
    - "event" - the event's name
    - "pool" - the TrueFi pool's name
    - "args" - the event's arguments

## Test Data

The agent behaviour can be verified with the following transactions:

- 0xb9aa4f34f2a60116f6601bf43b26cd1141973186b1cbdfc91190fa0eb1ef0bb0 (OracleChanged for tfTUSD)
- 0xae3a3908ad3d61ede549e725cc92a083f020870b798701ca635993cae5037167 (PauseStatusChanged for tfTUSD)
- 0x9e97a50b0eb7866d1926092076b30b435f90d36f4474053596e9276418c44882 (SafuChanged for tfTUSD)
