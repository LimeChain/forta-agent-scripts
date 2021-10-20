# Balancer Tokens Registered Agent

## Description

This agent detects when new tokens are added to a pool

## Supported Chains

- Ethereum

## Alerts

- BALANCER-TOKENS-REGISTERED
  - Fired when tokens are registered for pool
  - Severity is always set to "medium"
  - Type is always set to "info"
  - Metadata fields:
    - "poolId" - the pool's ID
    - "tokens" - the registered tokens
    - "assetManagers" - the asset managers for the tokens

## Test Data

The agent behaviour can be verified with the following transaction:

- 0xc511bcf50134fe53537a2c58c8d8016fcac59fac5420afb932fc27bbea9282be (Registered 2 tokens for 0x6ac02ecd0c2a23b11f9afb3b3aaf237169475cac0002000000000000000000a8 with no asset managers)
