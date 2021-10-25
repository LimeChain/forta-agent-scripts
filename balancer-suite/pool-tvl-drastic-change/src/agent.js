const { Finding, FindingType, FindingSeverity, getJsonRpcUrl } = require("forta-agent")
const { ethers } = require("ethers")
const { percentageDifferenceThreshold } = require("./agent-config.json")

const provider = new ethers.providers.JsonRpcProvider(getJsonRpcUrl())

const VAULT_ADDRESS = "0xba12222222228d8ba445958a75a0704d566bf2c8"
const EVENT_SIGNATURE = "PoolBalanceChanged(bytes32,address,address[],int256[],uint256[])"

const ABI = [
  "function getPoolTokens(bytes32) view returns (address[], uint256[], uint256)"
]

let vaultContract

function provideHandleInitialize(createContract) {
  return async function initialize() {
    vaultContract = createContract(VAULT_ADDRESS)
  }
}

async function handleTransaction(txEvent) {
  const findings = []
  const eventLog = txEvent.filterEvent(EVENT_SIGNATURE, VAULT_ADDRESS)

  for (const e of eventLog) {
    const poolId = e.topics[1]
    const liquidityProvider = e.topics[2]
    const { tokens, deltas } = decodeData(e.data)

    const poolTokens = await vaultContract.getPoolTokens(poolId)

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i]
      let delta = deltas[i]
      const balance = poolTokens[1][i]

      // If the delta is negative we need to convert it from Two's Complement
      if (delta.toHexString().startsWith("0xff")) {
        delta = delta.fromTwos(256)
      }

      const percentage = calculatePercentage(balance, delta)
      if (percentage >= percentageDifferenceThreshold) {
        findings.push(createAlert(poolId, token, percentage, liquidityProvider))
      }
    }
  }

  return findings
}

function createAlert(poolId, token, percentageDiff, liquidityProvider) {
  return Finding.fromObject({
    name: "Balancer Pool TVL drastic change",
    description: `Pool ${poolId} has drastic change in ${token} balance: ${percentageDiff}%`,
    alertId: "BALANCER-TVL-DRASTIC-CHANGE",
    protocol: "balancer",
    severity: FindingSeverity.Medium,
    type: FindingType.Suspicious,
    metadata: {
      poolId,
      token,
      percentageDiff,
      liquidityProvider
    },
  })
}

const calculatePercentage = (balance, delta) => {
  const prevBalance = balance.sub(delta)
  const balanceNum = ethers.utils.formatEther(prevBalance)
  const deltaNum = ethers.utils.formatEther(delta)
  console.log("balance and delta", balanceNum, deltaNum)
  return (Math.abs(deltaNum/balanceNum) * 100).toFixed(2)
}

const decodeData = (data) => {
  return ethers.utils.defaultAbiCoder.decode([
    "address[] tokens", "uint256[] deltas", "uint256[] protocolFeeAmounts"], data)
}

const createContract = (address) => {
  return new ethers.Contract(address, ABI, provider)
}

module.exports = {
  handleTransaction,
  initialize: provideHandleInitialize(createContract),
  provideHandleInitialize
}
