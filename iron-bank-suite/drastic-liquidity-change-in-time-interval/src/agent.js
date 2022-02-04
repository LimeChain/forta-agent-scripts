const { Finding, FindingSeverity, FindingType, getEthersProvider, ethers } = require("forta-agent")
const { Contract, Provider } = require('ethers-multicall')
const { getMarkets } = require("../../helper")

const INTERVAL = 10 * 60 // 10 minutes

// The minimum time differece between the current and the oldest liquidity (90%)
const MIN_DELTA_INTERVAL = INTERVAL * 90 / 100 
const PERCENTAGE_THRESHOLD = 50

const abi = [
  "function getCash() external view returns (uint256)",
  "function totalBorrowsCurrent() external view returns (uint256)"
]

const previousLiquidities = {}

let markets
let marketsAddresses
let ethcallProvider
const contracts = []

function provideInitialize(getMarkets, createProvider) {
  return async function initialize() {
    markets = await getMarkets()
    marketsAddresses = Object.keys(markets)
    marketsAddresses.forEach(a => {
      contracts[a] = new Contract(a, abi)
      previousLiquidities[a] = []
    })

    ethcallProvider = createProvider()
  }
}

async function handleBlock(blockEvent) {
  const findings = []
  const timestamp = blockEvent.block.timestamp

  const calls = marketsAddresses.map(a => [
    contracts[a].getCash(), contracts[a].totalBorrowsCurrent()
  ]).flat()

  const data = await ethcallProvider.all(calls)

  Object.entries(markets).forEach(([address, market], i) => {
    // The data has marketsLength * 2 entries
    // The even index is the cash and the odd index is the totalBorrows
    const cash = ethers.utils.formatEther(data[i*2])
    const totalBorrows = ethers.utils.formatEther(data[i*2 + 1])

    const oldLiquidity = getOldestLiquidityStoredForAsset(address, timestamp)

    previousLiquidities[address].push({
      timestamp,
      cash,
      totalBorrows
    })

    if (!oldLiquidity) return

    const cashDiffPercentage = calculatePercentage(cash, oldLiquidity.cash)
    const totalBorrowsDiffPercentage = calculatePercentage(totalBorrows, oldLiquidity.totalBorrows)

    if (Math.abs(cashDiffPercentage) > PERCENTAGE_THRESHOLD) {
      findings.push(createAlert(market.name, cashDiffPercentage, "cash"))
    }
    if (Math.abs(totalBorrowsDiffPercentage) > PERCENTAGE_THRESHOLD) {
      findings.push(createAlert(market.name, totalBorrowsDiffPercentage, "total borrows"))
    }
  })

  return findings
}

function getOldestLiquidityStoredForAsset(market, timestamp) {
  // Filter out any prices that fall outside of the time interval
  previousLiquidities[market] = previousLiquidities[market].filter(
    (e) => e.timestamp >= timestamp - INTERVAL
  )

  // Return null if there are no previous entries
  if (previousLiquidities[market].length === 0) return null

  // Return null if the time difference between now and the oldest 
  // is not at least 90% of the timeInterval
  const oldestLiquidity = previousLiquidities[market][0]
  if (timestamp - oldestLiquidity.timestamp < MIN_DELTA_INTERVAL) return null

  return oldestLiquidity
}

const createAlert = (market, percentage, type) => {
  return Finding.fromObject({
    name: "Drastic liquidity change for time period",
    description: `Market ${market} had a ${percentage}% change in ${type} for the last ${INTERVAL/60} minutes`,
    alertId: "IRON-BANK-DRASTIC-LIQUIDITY-CHANGE-FOR-TIME-PERIOD",
    protocol: "iron-bank",
    severity: FindingSeverity.Medium,
    type: FindingType.Info,
    metadata: {
      market,
      percentage,
      type
    },
  })
}

createProvider = () => {
  return new Provider(getEthersProvider(), 1)
}

const calculatePercentage = (current, previous) => {
  return ((current / previous - 1) * 100).toFixed(2)
}

module.exports = {
  initialize: provideInitialize(getMarkets, createProvider),
  provideInitialize,
  handleBlock
}
