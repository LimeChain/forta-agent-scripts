const { Finding, FindingSeverity, FindingType, ethers } = require("forta-agent")
const { getCdos, getVirtualPrices } = require("./helper")

let cdos
let getPrices
function provideInitialize(getCdos, getVirtualPrices) {
  return async function initialize() {
    cdos = await getCdos()
    getPrices = getVirtualPrices
  }
}

const handleBlock = async (blockEvent) => {
  const findings = []

  // 5 per minute * 10 minutes
  if (blockEvent.blockNumber % 50 != 0) return findings
  
  const virtualPrices = await getPrices(cdos)

  cdos.forEach( (cdo, i) => {
    const oldPriceAA = cdo["AATrancheToken"].oldPrice
    const oldPriceBB = cdo["BBTrancheToken"].oldPrice

    // The even elements are AA (senior) virtualPrices
    // The odd elemets are BB (junior) virtualPrices
    const currentPriceAA = virtualPrices[2*i]
    const currentPriceBB = virtualPrices[2*i + 1]

    if (currentPriceAA.lt(oldPriceAA)) {
      findings.push(createAlert(cdo.tokenSymbol, currentPriceAA, oldPriceAA, cdo.tokenDecimals, "AA"))
    }
    if (currentPriceBB.lt(oldPriceBB)) {
      findings.push(createAlert(cdo.tokenSymbol, currentPriceBB, oldPriceBB, cdo.tokenDecimals, "BB"))
    }

    cdo["AATrancheToken"].oldPrice = currentPriceAA
    cdo["BBTrancheToken"].oldPrice = currentPriceBB
  })

  return findings
}

function createAlert(symbol, price, oldPrice, decimals, trancheType) {
  return Finding.fromObject({
    name: "Perpetual Yield Tranches Virtual Price Decrease",
    description: `The ${trancheType} virtual price of the ${symbol} CDO has decreased`,
    alertId: "IDLE-PERPETUAL-YIELD-TRANCHES-VIRTUAL-PRICE-DECREASE",
    protocol: "idlefi",
    severity: FindingSeverity.Critical,
    type: FindingType.Suspicious,
    metadata: {
      price: ethers.utils.formatUnits(price, decimals),
      oldPrice: ethers.utils.formatUnits(oldPrice, decimals),
      trancheType,
      symbol
    }
  })
}

module.exports = {
  initialize: provideInitialize(getCdos, getVirtualPrices),
  provideInitialize,
  handleBlock,
}
