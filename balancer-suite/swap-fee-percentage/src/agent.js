const { Finding, FindingType, FindingSeverity, getJsonRpcUrl } = require("forta-agent")
const { ethers } = require("ethers")

const provider = new ethers.providers.JsonRpcProvider(getJsonRpcUrl())

const VAULT_ADDRESS = "0xba12222222228d8ba445958a75a0704d566bf2c8"
const EVENT_SIGNATURE = "SwapFeePercentageChanged(uint256)"

const POOL_ABI = [
  "function getVault() view returns (address)",
  "function name() view returns (string)"
]

function provideHandleTransaction(createContract) {
  return async function handleTransaction(txEvent) {
    const findings = []
    const eventLog = txEvent.filterEvent(EVENT_SIGNATURE)

    for (const e of eventLog) {
      const contract = createContract(e.address)

      try {
        const vault = await contract.getVault()

        // Ensure the contract's vault is the same as the Balancer V2 Vault
        if (vault.toLowerCase() === VAULT_ADDRESS) {
          const name = await contract.name()
          findings.push(createAlert(name, e.address, e.data))
        }
      } catch(e) {
        // If the contract doesn't have getVault() function
        // we should skip it
        continue
      }
    }

    return findings
  }
}

function createAlert(name, address, fee) {
  return Finding.fromObject({
    name: "Balancer Pool Swap Fee Percentage Changed",
    description: `New swap fee for ${name}: ${decodeData(fee)}%`,
    alertId: "BALANCER-SWAP-FEE-PERCENTAGE-CHANGED",
    protocol: "balancer",
    severity: FindingSeverity.Medium,
    type: FindingType.Info,
    metadata: {
      address,
      fee,
    },
  })
}

const decodeData = (data) => {
  const min = ethers.BigNumber.from("1000000000000") // 1e12 is the min fee (0.0001%)
  const number = ethers.utils.defaultAbiCoder.decode(["uint256 swapFeePercentage"], data).swapFeePercentage

  return number.div(min).toNumber() / 10_000 // gets the fee in percentages
}

const createContract = (address) => {
  return new ethers.Contract(address, POOL_ABI, provider)
}

module.exports = {
  provideHandleTransaction,
  handleTransaction: provideHandleTransaction(createContract),
}
