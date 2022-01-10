const { Finding, FindingSeverity, FindingType, ethers } = require("forta-agent")
const { markets } = require("./iron-bank-markets")

const marketsAddresses = Object.values(markets)
const GAS_USED_THRESHOLD = ethers.BigNumber.from(3_000_000)

async function handleTransaction(txEvent) {
  const findings = []

  // Check if an Iron Bank market is involved in the transaction
  const hasIronBankInteraction = marketsAddresses.some(market => txEvent.addresses[market])
  if (!hasIronBankInteraction) return findings

  const gasUsed = ethers.BigNumber.from(txEvent.gasUsed)

  if (gasUsed.gt(GAS_USED_THRESHOLD)) {
    findings.push(Finding.fromObject({
      name: "High gas",
      description: `Gas used is > 3M`,
      alertId: "IRON-BANK-HIGH-GAS",
      protocol: "iron-bank",
      severity: FindingSeverity.Medium,
      type: FindingType.Info,
      metadata: {
        gasUsed: gasUsed.toString()
      }
    }))
  }

  return findings
}

module.exports = {
  handleTransaction
}
