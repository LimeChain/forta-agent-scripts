const { Finding, FindingType, FindingSeverity, ethers } = require("forta-agent")
const config = require('./agent-config')

const MINUTE = 1000 * 60
const ABI = [ "function balanceOf(address) public view returns (uint256)" ]

let isChecking = false
let lastCheck = 0
let providers = {}
let contracts = {}
let alerts = []

async function initialize() {
  // Initialize the providers
  for (const [chain, info] of Object.entries(config.chains)) {
    providers[chain] = new ethers.providers.JsonRpcProvider(info.provider)
  }

  // Initialize the token contracts on each chain
  for (const [token, { address, sourceChain, destinationChains }] of Object.entries(config.tokens)) {
    contracts[token] = {}
    contracts[token][sourceChain] = new ethers.Contract(address, ABI, providers[sourceChain])

    for(const [chain, info] of Object.entries(destinationChains)) {
      contracts[token][chain] = new ethers.Contract(info.address, ABI, providers[chain])
    }
  }
}

function provideHandleBlock(config, contracts) {
  return async function handleBlock() {
    const now = Date.now()
    let findings = []
    if (alerts.length > 0) {
      findings = alerts
      alerts = []
    }

    if (!isChecking && (now - lastCheck > MINUTE)) {
      runJob(config, contracts)
    }

    return findings
    }
  }

async function runJob(config, contracts) {
  isChecking = true
  const tempAlerts = []
  for (const [name, { sourceChain, destinationChains }] of Object.entries(config.tokens)) {
    const lockedAmount = await contracts[name][sourceChain].balanceOf(config.chains[sourceChain].lockProxy)
    let totalUnlockedAmount = ethers.BigNumber.from(0)

    for(const [chain, info] of Object.entries(destinationChains)) {
      const balance = await contracts[name][chain].balanceOf(config.chains[chain].lockProxy)
      // Calculate the difference between the initial deposited and the current balance
      const diff = ethers.utils.parseUnits(info.initialBalance, 18).sub(balance)
      totalUnlockedAmount = totalUnlockedAmount.add(diff)
    }

    if (lockedAmount.lt(totalUnlockedAmount)) {
      tempAlerts.push(createAlert(name, lockedAmount, totalUnlockedAmount))
    }
  }
  isChecking = false
  alerts = tempAlerts
  lastCheck = Date.now()
}

function createAlert(token, lockedAmount, unlockedAmount) {
  return Finding.fromObject({
    name: "Poly Locked Amount Less Than Unlocked",
    description: `The locked amount in the source chain is less than the total unlock amount in the destination chains`,
    alertId: "POLY-LOCKED-AMOUNT-LESS-THAN-UNLOCKED",
    protocol: "poly",
    severity: FindingSeverity.Critical,
    type: FindingType.Exploit,
    metadata: {
      token,
      lockedAmount: lockedAmount.toHexString(),
      unlockedAmount: unlockedAmount.toHexString()
    },
  })
}

module.exports = {
  provideHandleBlock,
  handleBlock: provideHandleBlock(config, contracts),
  initialize,
  contracts
}
