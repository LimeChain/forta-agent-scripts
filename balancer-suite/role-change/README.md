# Balancer Pool Role Granted/Revoked

## Description

This agent detects when the Balancer Authorizer grants or revokes role for address

## Supported Chains

- Ethereum

## Alerts

- BALANCER-ROLE-CHANGE
  - Fired when a role is granted/revoked
  - Severity is always set to "medium"
  - Type is always set to "info"
  - Metadata fields:
    - "role" - the role's hash
    - "account" - the account for which the role has been granted/revoked
    - "isGranted" - true if the role is granted; false if the role is revoked 
    - "from" - the address which initiated the role change

## Test Data

The agent behaviour can be verified with the following transactions:

- 0x8053886f0571f1b5e0f3c4dcb58b2cc41fad564955fca62821c1fd7ca13688ce (Role setSwapFeePercentage granted to 0xe4a8ed6c1d8d048bd29a00946bfcf2db10e7923b)
- 0xcb9304ef9134ddf6732bd2e2f3d50137700846c4eea723d4bc491acf0f82f012 (Roles startAmplificationParameterUpdate and stopAmplificationParameterUpdate granted for 0xf4a80929163c5179ca042e1b292f5efbbe3d89e6)
