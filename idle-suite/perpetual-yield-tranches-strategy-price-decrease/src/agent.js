const { Finding, FindingSeverity, FindingType, ethers } = require("forta-agent")
const { getStrategies, getStrategyPrices } = require("./helper")

let strategies
let getPrices
function provideInitialize(getStrategies, getStrategyPrices) {
  return async function initialize() {
    strategies = await getStrategies()
    getPrices = getStrategyPrices
  }
}

const handleBlock = async (blockEvent) => {
  const findings = []

  // 5 per minute * 10 minutes
  // if (blockEvent.blockNumber % 50 != 0) return findings
  
  const prices = await getPrices(strategies)

  strategies.forEach( (strategy, i) => {
    const oldPrice = strategy.oldPrice
    const currentPrice = prices[i]

    if (currentPrice.lt(oldPrice)) {
      findings.push(createAlert(strategy.tokenSymbol, currentPrice, oldPrice, strategy.tokenDecimals))
    }

    strategy.oldPrice = currentPrice
  })

  return findings
}

function createAlert(symbol, price, oldPrice, decimals) {
  return Finding.fromObject({
    name: "Perpetual Yield Tranches Strategy Price Decrease",
    description: `The price of the ${symbol} strategy has decreased`,
    alertId: "IDLE-PERPETUAL-YIELD-TRANCHES-STRATEGY-PRICE-DECREASE",
    protocol: "idlefi",
    severity: FindingSeverity.Critical,
    type: FindingType.Suspicious,
    metadata: {
      price: ethers.utils.formatUnits(price, decimals),
      oldPrice: ethers.utils.formatUnits(oldPrice, decimals),
      symbol
    }
  })
}

module.exports = {
  initialize: provideInitialize(getStrategies, getStrategyPrices),
  provideInitialize,
  handleBlock,
}
