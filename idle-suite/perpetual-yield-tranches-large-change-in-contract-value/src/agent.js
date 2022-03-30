const { Finding, FindingSeverity, FindingType, ethers } = require("forta-agent")
const { getCdos, getContractValuesInUsd } = require("./helper")

const VALUE_DIFFERENCE_THRESHOLD = 10_000

let cdos
let getValues
function provideInitialize(getCdos, getContractValuesInUsd) {
  return async function initialize() {
    cdos = await getCdos()
    getValues = getContractValuesInUsd
  }
}

const handleBlock = async (blockEvent) => {
  const findings = []

  // 5 per minute * 10 minutes
  if (blockEvent.blockNumber % 50 != 0) return findings
  
  // Get the current value in USD for every CDO
  const values = await getValues(cdos)

  cdos.forEach( (cdo, i) => {
    const oldContractValue = cdo.oldContractValue
    const currentContractValue = values[i]

    const difference = currentContractValue - oldContractValue

    if (Math.abs(difference) > VALUE_DIFFERENCE_THRESHOLD) {
      findings.push(createAlert(cdo.tokenSymbol, currentContractValue, oldContractValue, difference))
    }

    // Update the contractValue
    cdo.oldContractValue = currentContractValue
  })

  return findings
}

function createAlert(symbol, value, oldValue, difference) {
  return Finding.fromObject({
    name: "Perpetual Yield Tranches Large Change in Contract Value",
    description: `The contractValue of the ${symbol} CDO has changed by ${difference} USD`,
    alertId: "IDLE-PERPETUAL-YIELD-TRANCHES-DRASTIC-CHANGE-IN-CONTRACT-VALUE",
    protocol: "idlefi",
    severity: FindingSeverity.Medium,
    type: FindingType.Info,
    metadata: {
      value,
      oldValue,
      cdo: symbol
    }
  })
}

module.exports = {
  initialize: provideInitialize(getCdos, getContractValuesInUsd),
  provideInitialize,
  handleBlock,
}
