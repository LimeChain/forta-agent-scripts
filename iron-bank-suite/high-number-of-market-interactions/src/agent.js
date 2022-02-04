const { Finding, FindingSeverity, FindingType } = require("forta-agent")
const { getMarkets } = require("../../helper")
const Counter = require("./counter")

const INTERVAL = 5 * 60 // 5 minutes
const INTERACTIONS_THRESHOLD = 10

const counter = new Counter(INTERVAL)

const ironBankEventSigs = [
  "event Mint(address minter, uint256 mintAmount, uint256 mintTokens)",
  "event Redeem(address redeemer, uint256 redeemAmount, uint256 redeemTokens)",
  "event Borrow(address borrower, uint256 borrowAmount, uint256 accountBorrows, uint256 totalBorrows)",
  "event RepayBorrow(address payer, address borrower, uint256 repayAmount, uint256 accountBorrows, uint256 totalBorrows)",
  "event Transfer(address indexed from, address indexed to, uint256 amount)",
  "event Flashloan(address indexed receiver, uint256 amount, uint256 totalFee, uint256 reservesFee)",
  "event LiquidateBorrow(address liquidator, address borrower, uint256 repayAmount, address cTokenCollateral, uint256 seizeTokens)"
]

let markets
function provideInitialize(getMarkets) {
  return async function initialize() {
    markets = await getMarkets()
  }
}

async function handleTransaction(txEvent) {
  const findings = []
  const timestamp = txEvent.block.timestamp
  const hash = txEvent.hash
  
  const events = txEvent.filterLog(ironBankEventSigs)
      .filter(event => markets[event.address])

  events.forEach(event => {
    const market = event.address
    const action = event.name
    const count = counter.increment(market, action, hash, timestamp)

    if (count > INTERACTIONS_THRESHOLD) {
      findings.push(createAlert(market))
      counter.reset(market)
    }
  })

  return findings
}

const createAlert = (market) => {
  return Finding.fromObject({
    name: "High number of market interactions",
    description: `There were more than ${INTERACTIONS_THRESHOLD} interactions ` +
    `with ${markets[market].name} market in the last ${INTERVAL/60} minutes`,
    alertId: "IRON-BANK-HIGH-NUMBER-OF-MARKET-INTERACTIONS",
    protocol: "iron-bank",
    severity: FindingSeverity.Medium,
    type: FindingType.Info,
    metadata: {
      market,
      interactions: counter.getInteractions(market)
    },
  })
}

module.exports = {
  initialize: provideInitialize(getMarkets),
  provideInitialize,
  handleTransaction
}
