const { Finding, FindingSeverity, FindingType } = require("forta-agent")
const { getMarkets } = require("./helper")

const MARKETS_COUNT_THRESHOLD = 4

let markets
let marketsAddresses

function provideInitialize(getMarkets) {
  return async function initialize() {
    markets = await getMarkets()
    marketsAddresses = Object.keys(markets)
  }
}

async function handleTransaction(txEvent) {
  const findings = []

  const txMarkets = marketsAddresses.filter(e => txEvent.addresses[e])

  if (txMarkets.length > MARKETS_COUNT_THRESHOLD) {
    findings.push(Finding.fromObject({
      name: "High number of Iron Bank markets",
      description: `The transaction interacted with more than ${MARKETS_COUNT_THRESHOLD} Iron Bank markets`,
      alertId: "IRON-BANK-HIGH-NUMBER-OF-MARKETS",
      protocol: "iron-bank",
      severity: FindingSeverity.Medium,
      type: FindingType.Suspicious,
      metadata: {
        markets: txMarkets
      }
    }))
  }

  return findings
}

module.exports = {
  provideInitialize,
  initialize: provideInitialize(getMarkets),
  handleTransaction
}
