const { Finding, FindingSeverity, FindingType } = require("forta-agent")
const { markets } = require("./iron-bank-markets")

const marketsAddresses = Object.values(markets)
const MARKETS_COUNT_THRESHOLD = 4

async function handleTransaction(txEvent) {
  const findings = []

  const marketsCount = marketsAddresses.filter(e => txEvent.addresses[e]).length

  if (marketsCount > MARKETS_COUNT_THRESHOLD) {
    findings.push(Finding.fromObject({
      name: "High number of Iron Bank markets",
      description: `The transaction interacted with more than ${MARKETS_COUNT_THRESHOLD} Iron Bank markets`,
      alertId: "IRON-BANK-HIGH-NUMBER-OF-MARKETS",
      protocol: "iron-bank",
      severity: FindingSeverity.Medium,
      type: FindingType.Suspicious,
    }))
  }

  return findings
}

module.exports = {
  handleTransaction
}
