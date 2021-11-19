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
  for (const token of config.tokens) {
    const { name, address, sourceChain, destinationChains } = token
    contracts[name] = {}
    contracts[name][sourceChain] = new ethers.Contract(address, ABI, providers[sourceChain])

    for(const dstChain of destinationChains) {
      const { chain, address } = dstChain
      contracts[name][chain] = new ethers.Contract(address, ABI, providers[chain])
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

    // Check amounts only if it is not checking at the moment
    // and the last check was > 1 minute ago
    if (!isChecking && (now - lastCheck > MINUTE)) {
      runJob(config, contracts)
    }

    return findings
    }
  }

// We pass the config and contracts so we can mock them
async function runJob(config, contracts) {
  isChecking = true

  const tokenPromises = config.tokens.map(token => getAlerts(token, contracts, config))

  // Remove the null elements
  alerts = (await Promise.all(tokenPromises)).filter(alert => !!alert)
  isChecking = false
  lastCheck = Date.now()
}

const getAlerts = (token, contracts, config) => new Promise(
  async (resolve) => {
    const { name, decimals, sourceChain, destinationChains } = token
    const lockedAmount = await contracts[name][sourceChain]
      .balanceOf(config.chains[sourceChain].lockProxy)
    const unlockedAmountPromises = destinationChains.map(dstChain => 
      getUnlockedAmounts(dstChain, name, decimals, contracts, config))

    // Sum all unlocked amounts
    const totalUnlockedAmount = (await Promise.all(unlockedAmountPromises)).reduce((a,b) => {
      return a.add(b)
    }, ethers.BigNumber.from(0))

    if (lockedAmount.lt(totalUnlockedAmount)) {
      resolve(createAlert(name, lockedAmount, totalUnlockedAmount))
    } else {
      resolve(null)
    }
  }
)

const getUnlockedAmounts = (dstChain, name, decimals, contracts, config) => new Promise(
  async (resolve) => {
    const { chain, initialBalance } = dstChain
    const balance = await contracts[name][chain].balanceOf(config.chains[chain].lockProxy)
    // Calculate the difference between the initial deposited and the current balance
    const diff = ethers.utils.parseUnits(initialBalance, decimals).sub(balance)
    resolve(diff)
  }
)

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
  initialize
}
