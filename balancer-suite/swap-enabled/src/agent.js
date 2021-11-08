const { Finding, FindingType, FindingSeverity, getJsonRpcUrl } = require("forta-agent")
const { ethers } = require("ethers")

const provider = new ethers.providers.JsonRpcProvider(getJsonRpcUrl())

const VAULT_ADDRESS = "0xba12222222228d8ba445958a75a0704d566bf2c8"
const EVENT = "event SwapEnabledSet(bool swapEnabled)"

const POOL_ABI = [
  "function getVault() view returns (address)"
]

function provideHandleTransaction(createContract) {
  return async function handleTransaction(txEvent) {
    const findings = []
    const eventLog = txEvent.filterLog(EVENT)

    for (const e of eventLog) {
      const contract = createContract(e.address)
      const { swapEnabled } = e.args

      try {
        const vault = await contract.getVault()

        // Ensure the contract's vault is the same as the Balancer V2 Vault
        if (vault.toLowerCase() === VAULT_ADDRESS) {
          findings.push(createAlert(e.address, swapEnabled, txEvent.from))
        }
      } catch(e) {
        // If the contract doesn't have getVault() function
        // we should skip it
        continue
      }
    }

    function createAlert(address, state, from) {
      stateString = state ? "enabled" : "disabled"

      return Finding.fromObject({
        name: "Balancer Pool Swap Enabled Changed",
        description: `Swaps for pool ${address} are ${stateString}`,
        alertId: "BALANCER-SWAP-ENABLED-CHANGED",
        protocol: "balancer",
        severity: FindingSeverity.Medium,
        type: FindingType.Suspicious,
        metadata: {
          address,
          swapEnabled: state,
          from
        },
      })
    }

    return findings
  }
}

const createContract = (address) => {
  return new ethers.Contract(address, POOL_ABI, provider)
}

module.exports = {
  provideHandleTransaction,
  handleTransaction: provideHandleTransaction(createContract),
}
