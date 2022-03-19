const { Finding, FindingSeverity, FindingType, ethers } = require("forta-agent")
const { getMarkets, getTokenPrices } = require("./helper")

let markets
let contracts
let getPrices
function provideInitialize(getMarkets, getTokenPrices) {
  return async function initialize() {
    markets = await getMarkets()
    contracts = markets.map(m => m.contract)

    getPrices = getTokenPrices
  }
}

const handleBlock = async (blockEvent) => {
  const findings = []

  // 5 per minute * 10 minutes
  if (blockEvent.blockNumber % 50 != 0) return findings
  
  const tokenPrices = await getPrices(contracts)
  tokenPrices.forEach((price, i) => {
    const oldPrice = markets[i].oldPrice

    if (price.lt(oldPrice)) {
      findings.push(createAlert(markets[i].symbol, price, oldPrice, markets[i].decimals))
    }

    // Update the price
    markets[i].oldPrice = price
  })

  return findings
}

function createAlert(symbol, price, oldPrice, decimals) {
  return Finding.fromObject({
    name: "Best Yield Token Price Decrease",
    description: `The token price of ${symbol} has decreased`,
    alertId: "IDLE-BEST-YIELD-TOKEN-PRICE-DECREASE",
    protocol: "idlefi",
    severity: FindingSeverity.Medium,
    type: FindingType.Info,
    metadata: {
      price: ethers.utils.formatUnits(price, decimals),
      oldPrice: ethers.utils.formatUnits(oldPrice, decimals)
    }
  })
}

module.exports = {
  initialize: provideInitialize(getMarkets, getTokenPrices),
  provideInitialize,
  handleBlock,
}
