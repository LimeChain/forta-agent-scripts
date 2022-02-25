const { Finding, FindingSeverity, FindingType, ethers } = require("forta-agent")
const { Contract } = require('ethers-multicall')
const { getMarkets, getOracle, getProvider } = require("./helper")

const INTERVAL = 1 * 60 * 60 // 1 hour

// Check if the delta of the prices is between 90% of the interval and the interval
const MIN_DELTA_INTERVAL = INTERVAL * 90 / 100 
const PERCENTAGE_THRESHOLD = 30

const abi = ["function getUnderlyingPrice(address cToken) public view returns (uint)"]

const oraclePrices = {}

let markets
let marketsAddresses
let ethcallProvider
let oracleContract

function provideInitialize(getMarkets, getOracle, getProvider) {
  return async function initialize() {
    markets = await getMarkets()
    marketsAddresses = Object.keys(markets)
    marketsAddresses.forEach(a => oraclePrices[a] = [])

    const oracleAddress = await getOracle()
    oracleContract = new Contract(oracleAddress, abi)

    ethcallProvider = getProvider()
  }
}

async function handleBlock(blockEvent) {
  const findings = []

  // Check prices every 10 blocks (~2 minutes)
  if (blockEvent.blockNumber % 10 !== 0) return findings

  const timestamp = blockEvent.block.timestamp

  const calls = marketsAddresses.map(a => oracleContract.getUnderlyingPrice(a))
  const prices = await ethcallProvider.all(calls)

  Object.entries(markets).forEach(([address, market], i) => {
    const price = ethers.utils.formatEther(prices[i])

    const oldPrice = getOldestPriceStoredForAsset(address, timestamp)

    // Add the current price
    oraclePrices[address].push({
      price,
      timestamp,
    })

    if (!oldPrice) return

    const percentage = calculatePercentage(price, oldPrice)
    if (Math.abs(percentage) > PERCENTAGE_THRESHOLD) {
      findings.push(createAlert(market.name, percentage))
    }
  })

  return findings
}

function getOldestPriceStoredForAsset(market, timestamp) {
  // Filter out any prices that fall outside of the time interval
  oraclePrices[market] = oraclePrices[market].filter(
    (p) => p.timestamp >= timestamp - INTERVAL
  )

  // Return null if there is only one price (the current one)
  if (oraclePrices[market].length === 0) return null

  // Return null if the difference between the current and the oldest price 
  // is not at least 90% of the timeInterval
  const oldestPrice = oraclePrices[market][0]
  if (timestamp - oldestPrice.timestamp < MIN_DELTA_INTERVAL) return null

  return oldestPrice.price
}

const createAlert = (market, percentage) => {
  return Finding.fromObject({
    name: "Drastic price change",
    description: `Price for ${market} changed with ${percentage}% for the last ${INTERVAL/60} minutes`,
    alertId: "IRON-BANK-DRASTIC-PRICE-CHANGE",
    protocol: "iron-bank",
    severity: FindingSeverity.Medium,
    type: FindingType.Info,
    metadata: {
      market,
      percentage
    },
  })
}

const calculatePercentage = (current, previous) => {
  return ((current / previous - 1) * 100).toFixed(2)
}

module.exports = {
  initialize: provideInitialize(getMarkets, getOracle, getProvider),
  provideInitialize,
  handleBlock
}
