const { Finding, FindingSeverity, FindingType, ethers } = require("forta-agent")
const { markets } = require("./iron-bank-markets")

const marketsAddresses = Object.values(markets)
const eventSig = "event AccrueInterest(uint256 cashPrior, uint256 interestAccumulated, uint256 borrowIndex, uint256 totalBorrows)"
const PERCENTAGE_THRESHOLD = 70

const marketsLiquidity = {}

function initialize() {
  marketsAddresses.forEach(a => marketsLiquidity[a] = {})
}

async function handleTransaction(txEvent) {
  const findings = []

  const events = txEvent.filterLog(eventSig)
    .filter(e => marketsAddresses.includes(e.address))

  for(const event of events) {
    const address = event.address
    const { cashPrior, totalBorrows } = event.args

    // Calculate cashPrior and totalBorrows percentage difference
    const cashPriorPercentage = 
      calculatePercentage(cashPrior, marketsLiquidity[address].cashPrior)
    const totalBorrowsPercentage = 
      calculatePercentage(totalBorrows, marketsLiquidity[address].totalBorrows)

    if (cashPriorPercentage > PERCENTAGE_THRESHOLD) {
      findings.push(createCashPriorAlert(address, cashPriorPercentage))
    }

    if (totalBorrowsPercentage > PERCENTAGE_THRESHOLD) {
      findings.push(createTotalBorrowsAlert(address, totalBorrowsPercentage))
    }

    // Update the liquidity
    marketsLiquidity[address].cashPrior = cashPrior
    marketsLiquidity[address].totalBorrows = totalBorrows
  }

  return findings
}

const calculatePercentage = (current, previous) => {
  // Return 0 if we don't have the previous value
  if(!previous) return "0.00"

  const previuosNum = ethers.utils.formatEther(previous)
  const currentNum = ethers.utils.formatEther(current)
  return (Math.abs(currentNum/previuosNum - 1) * 100).toFixed(2)
}

const createCashPriorAlert = (address, percentage) => {
  return createAlert(address, percentage, "cashPrior")
}

const createTotalBorrowsAlert = (address, percentage) => {
  return createAlert(address, percentage, "totalBorrows")
}

const createAlert = (address, percentage, type) => {
  return Finding.fromObject({
      name: "Drastic liquidity change",
      description: `${type} for ${getAddressName(address)} has drastically changed`,
      alertId: "IRON-BANK-DRASTIC-LIQUIDITY-CHANGE",
      protocol: "iron-bank",
      severity: FindingSeverity.Medium,
      type: FindingType.Suspicious,
      metadata: {
        address,
        percentage,
        type
      },
    })
}

const getAddressName = (address) => {
  for (const [key, value] of Object.entries(markets)) {
    if (address === value) return key
  }
}

module.exports = {
  handleTransaction,
  initialize
}
