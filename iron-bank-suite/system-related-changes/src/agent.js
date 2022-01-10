const { Finding, FindingSeverity, FindingType } = require("forta-agent")
const { markets, comptrollerEventSigs, marketEventSigs } = require("./agent-config")

const marketsAddresses = Object.values(markets)
const comptrollerAddress = "0xab1c342c7bf5ec5f02adea1c2270670bca144cbb"

async function handleTransaction(txEvent) {
  const findings = []

  const events = txEvent.filterLog([...comptrollerEventSigs, ...marketEventSigs])
    .filter(e => marketsAddresses.includes(e.address) || e.address === comptrollerAddress)

  events.forEach(e => findings.push(createAlert(e)))

  return findings
}

const createAlert = (event) => {
  const { name, address } = event
  const addressName = getAddressName(address)
  return Finding.fromObject({
    name: "System related change",
    description: `${name} for ${addressName}`,
    alertId: "IRON-BANK-SYSTEM-RELATED-CHANGE",
    protocol: "iron-bank",
    severity: FindingSeverity.Medium,
    type: FindingType.Info,
    metadata: {
      address,
      name
    },
  })
}

const getAddressName = (address) => {
  if (address === comptrollerAddress) return "Comptroller"

  for (const [key, value] of Object.entries(markets)) {
    if (address === value) return key
  }

  return address
}

module.exports = {
  handleTransaction
}
