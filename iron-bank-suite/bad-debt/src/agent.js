const { Finding, FindingSeverity, FindingType } = require("forta-agent")
const { getMarkets, getProvider } = require("./helper")
const { Contract } = require('ethers-multicall')

const COMPTROLLER_ADDRESS = "0xab1c342c7bf5ec5f02adea1c2270670bca144cbb"
const COMPTROLLER_ABI = ["function getAccountLiquidity(address account) public view returns (uint256, uint256, uint256)"]

const ironBankEventSigs = [
  "event Mint(address minter, uint256 mintAmount, uint256 mintTokens)",
  "event Redeem(address redeemer, uint256 redeemAmount, uint256 redeemTokens)",
  "event Borrow(address borrower, uint256 borrowAmount, uint256 accountBorrows, uint256 totalBorrows)",
  "event RepayBorrow(address payer, address borrower, uint256 repayAmount, uint256 accountBorrows, uint256 totalBorrows)",
  "event Transfer(address indexed from, address indexed to, uint256 amount)",
  "event Flashloan(address indexed receiver, uint256 amount, uint256 totalFee, uint256 reservesFee)"
]

let markets
let ethcallProvider
let comptrollerContract
function provideInitialize(getMarkets, getProvider) {
  return async function initialize() {
    comptrollerContract = new Contract(COMPTROLLER_ADDRESS, COMPTROLLER_ABI)
    ethcallProvider = getProvider()
    markets = await getMarkets()
  }
}

async function handleTransaction(txEvent) {
  const findings = []
  const accounts = new Set()

  txEvent.filterLog(ironBankEventSigs)
    // Check if the event is from Iron Bank address
    .filter(e => markets[e.address])
    .map(e => e.args[0]) // args[0] is always the initiating account
    .forEach(e => accounts.add(e))

  const accountsArray = [...accounts]
  const calls = accountsArray.map(account => comptrollerContract.getAccountLiquidity(account))

  const data = await ethcallProvider.all(calls)

  accountsArray.forEach( (account, i) => {
    // getAccountLiquidity returns (possible error code (semi-opaque),
    // account liquidity in excess of collateral requirements,
    // account shortfall below collateral requirements)
    const shortfall = data[i][2]
    
    if (shortfall.gt(0)) {
      findings.push(createAlert(account, shortfall))
    }
  })

  return findings
}

const createAlert = (account, shortfall) => {
  return Finding.fromObject({
    name: "Account has bad debt",
    description: `Account has bad debt after interacting with the Iron Bank`,
    alertId: "IRON-BANK-BAD-DEBT",
    protocol: "iron-bank",
    severity: FindingSeverity.Medium,
    type: FindingType.Info,
    metadata: {
      account,
      shortfall: shortfall.toString(),
    },
  })
}

module.exports = {
  provideInitialize,
  initialize: provideInitialize(getMarkets, getProvider),
  handleTransaction,
}
