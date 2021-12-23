const { Finding, FindingSeverity, FindingType } = require("forta-agent")

const comptrollerAddress = "0xab1c342c7bf5ec5f02adea1c2270670bca144cbb"
const eventSig = "event CreditLimitChanged(address protocol, uint256 creditLimit)"

async function handleTransaction(txEvent) {
  const findings = []

  const events = txEvent.filterLog(eventSig, comptrollerAddress)

  for(const event of events) {
    const { protocol, creditLimit } = event.args

    findings.push(Finding.fromObject({
      name: "Credit limit changed",
      description: `Credit limit for protocol ${protocol} has changed`,
      alertId: "IRON-BANK-CREDIT-LIMIT-CHANGED",
      protocol: "iron-bank",
      severity: FindingSeverity.Medium,
      type: FindingType.Info,
      metadata: {
        protocol,
        creditLimit: creditLimit.toString()
      },
    }))
  }

  return findings
}

module.exports = {
  handleTransaction
}
