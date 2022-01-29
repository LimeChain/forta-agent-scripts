const { Finding, FindingSeverity, FindingType } = require("forta-agent")
const { getMarkets } = require("../../helper")
const Counter = require("./counter")

const INTERVAL = 10 * 60 // 10 minutes
const INTERACTIONS_THRESHOLD = 20

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
    const account = event.args[0] // args[0] is always the initiating account
    const action = event.name
    const count = counter.increment(account, action, hash, timestamp)

    if (count > INTERACTIONS_THRESHOLD) {
      findings.push(createAlert(account))
      counter.reset(account)
    }
  })

  return findings
}

const createAlert = (account) => {
  return Finding.fromObject({
    name: "High number of market interactions by address",
    description: `Account ${account} interacted with Iron Bank markets more ` +
        `than ${INTERACTIONS_THRESHOLD} times in the last ${INTERVAL/60} minutes`,
    alertId: "IRON-BANK-HIGH-NUMBER-OF-INTERACTIONS-BY-ADDRESS",
    protocol: "iron-bank",
    severity: FindingSeverity.Medium,
    type: FindingType.Info,
    metadata: {
      account,
      interactions: counter.getInteractions(account)
    },
  })
}

module.exports = {
  initialize: provideInitialize(getMarkets),
  provideInitialize,
  handleTransaction
}
