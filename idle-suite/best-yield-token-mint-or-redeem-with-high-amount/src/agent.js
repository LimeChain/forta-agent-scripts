const { Finding, FindingSeverity, FindingType, ethers } = require("forta-agent")
const { getMarkets, getOracle, getProvider } = require("./helper")

const transferEvent = "event Transfer(address indexed from, address indexed to, uint256 amount)"
const addressZero = ethers.constants.AddressZero

// Alert on mints/redeems above the threshold
const AMOUNT_THRESHOLD = 10_000

let markets
let oracle
let ethcallProvider
let marketsAddresses
function provideInitialize(getMarkets, getOracle, getProvider) {
  return async function initialize() {
    markets = await getMarkets()
    oracle = await getOracle()
    ethcallProvider = getProvider()
    marketsAddresses = Object.keys(markets)
  }
}

const handleTransaction = async (txEvent) => {
  const findings = []

  // Get only the transfer events that are from or to the addressZero (mints/redeems)
  const events = txEvent.filterLog(transferEvent, marketsAddresses)
      .filter(e => e.args.from === addressZero || e.args.to === addressZero)

  // For every event get the price of the underlying asset in USD
  // and the price of the idle token in underlying tokens
  const calls = events.map(event => {
    const market = markets[event.address]
    return [
      oracle.getPriceUSD(market.token),
      market.contract.tokenPrice()
    ]
  }).flat()

  const prices = await ethcallProvider.all(calls)

  events.forEach((event, i) => {
    const { from, amount } = event.args
    const market = markets[event.address]

    // Every even index is a USD price and every odd index is an underlying price
    const usdPrice = ethers.utils.formatEther(prices[2*i])
    const underlyingPrice = ethers.utils.formatUnits(prices[2*i + 1], market.decimals)

    const formatedAmount = ethers.utils.formatEther(amount)

    // The price of 1 idleToken = 
    // the price of the underlying in USD * 
    // the price of 1 idleToken in underlying tokens
    const idleTokenPrice = usdPrice * underlyingPrice
    const usdAmount = formatedAmount * idleTokenPrice

    const type = (from === addressZero) ? "Mint" : "Redeem"

    if (usdAmount > AMOUNT_THRESHOLD) {
      findings.push(createAlert(market.symbol, usdAmount, type))
    }
  })
  
  return findings
}

function createAlert(symbol, usdAmount, type) {
  return Finding.fromObject({
    name: `Best Yield Token ${type} With High Amount`,
    description: `${type} of ${symbol} tokens with high amount`,
    alertId: "IDLE-BEST-YIELD-MINT-OR-BORROW-WITH-HIGH-AMOUNT",
    protocol: "idlefi",
    severity: FindingSeverity.Medium,
    type: FindingType.Info,
    metadata: {
      type,
      usdAmount
    }
  })
}

module.exports = {
  initialize: provideInitialize(getMarkets, getOracle, getProvider),
  provideInitialize,
  handleTransaction,
}
