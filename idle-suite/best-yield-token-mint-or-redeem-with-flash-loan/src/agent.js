const { Finding, FindingSeverity, FindingType, ethers } = require("forta-agent")
const {
  init,
  getMarkets,
  getAction,
} = require("./helper")
const FlashloanDetector = require('forta-flashloan-detector')

const transferEvent = "event Transfer(address indexed from, address indexed to, uint256 amount)"
const addressZero = ethers.constants.AddressZero

let markets
let marketsAddresses
let flashloanDetector

function provideInitialize(init, getMarkets, detector) {
  return async function initialize() {
    await init()

    flashloanDetector = detector
    await flashloanDetector.init()

    markets = getMarkets()
    marketsAddresses = Object.keys(markets)
  }
}

const handleTransaction = async (txEvent) => {
  const findings = []

  // Check if there is a mint or redeem
  const interactions = txEvent.filterLog(transferEvent, marketsAddresses)
      .filter(e => e.args.from === addressZero || e.args.to === addressZero)
      .map(e => {
        const type = (e.args.from === addressZero) ? "Mint" : "Redeem"
        const symbol = markets[e.address].symbol
        return { type, symbol }
      })

  if (interactions.length === 0) return findings

  // Get action (mint, redeem or mint and redeem)
  const action = getAction(interactions)

  // Check if there is a flashloan
  const flashloanProtocols = flashloanDetector.getFlashloans(txEvent);

  if (flashloanProtocols.length > 0) {
    findings.push(createAlert(interactions, flashloanProtocols, action))
  }
  
  return findings
}

function createAlert(interactions, protocols, action) {
  return Finding.fromObject({
    name: `Best Yield Token ${action} With Flashloan`,
    description: `${action} of Idle tokens in a transaction with flashloan`,
    alertId: "IDLE-BEST-YIELD-MINT-OR-BORROW-WITH-FLASHLOAN",
    protocol: "idlefi",
    severity: FindingSeverity.Medium,
    type: FindingType.Info,
    metadata: {
      interactions,
      protocols
    }
  })
}

module.exports = {
  initialize: provideInitialize(init, getMarkets, new FlashloanDetector()),
  provideInitialize,
  handleTransaction,
}
