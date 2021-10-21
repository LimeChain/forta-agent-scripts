const { Finding, FindingType, FindingSeverity, getJsonRpcUrl } = require("forta-agent")
const { ethers } = require("ethers")
const { pools, window, maxPercentDiff } = require("./agent-config.json")
const provider = new ethers.providers.JsonRpcProvider(getJsonRpcUrl())

const POOL_ABI = [
  "function getLatest(uint8) view returns (uint256)",
  "function getTimeWeightedAverage(tuple(uint8, uint256, uint256)[]) view returns (uint256[])"
]
let contracts = []

function provideHandleInitialize(createContract) {
  return async function initialize() {
    for (const pool of pools) {
      contracts.push(createContract(pool.address))
    }
  }
}

async function handleBlock() {
  const findings = []

  for (const [i, contract] of contracts.entries()) {
    const latest = await contract.getLatest(0)
    const latestNum = ethers.utils.formatEther(latest)

    const twap = await contract.getTimeWeightedAverage([[0, window, 0]])
    const twapNum = ethers.utils.formatEther(twap[0])

    const percentageDiff = calculatePercentage(latestNum, twapNum)

    if (percentageDiff >= maxPercentDiff) {
      findings.push(createAlert(pools[i].name, percentageDiff, latest, twap))
    }
  }
  
  return findings
}

function createAlert(poolName, percentageDiff, latest, twap) {
  return Finding.fromObject({
    name: `Balancer Oracle Disparity`,
    description: `The difference between the instant and the resilient prices for pool ${poolName} is ${percentageDiff}%`,
    alertId: "BALANCER-ORACLE-DISPARITY",
    protocol: "balancer",
    severity: FindingSeverity.Medium,
    type: FindingType.Suspicious,
    metadata: {
      poolName,
      instantPrice: latest,
      resilientPrice: twap,
      percentageDiff
    },
  })
}

const calculatePercentage = (latest, twap) => {
  return ((Math.abs(latest/twap) - 1) * 100).toFixed(2)
}

const createContract = (address) => {
  return new ethers.Contract(address, POOL_ABI, provider)
}

module.exports = {
  handleBlock,
  provideHandleInitialize,
  initialize: provideHandleInitialize(createContract)
}
