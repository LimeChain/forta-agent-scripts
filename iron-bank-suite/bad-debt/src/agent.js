const { Finding, FindingSeverity, FindingType, ethers, getEthersProvider } = require("forta-agent")
const { markets } = require("./iron-bank-markets")

const COMPTROLLER_ADDRESS = "0xab1c342c7bf5ec5f02adea1c2270670bca144cbb"
const COMPTROLLER_ABI = ["function getAccountLiquidity(address account) public view returns (uint256, uint256, uint256)"]
let comptrollerContract

const marketsAddresses = Object.values(markets)
const ironBankEventSigs = [
  "event Mint(address minter, uint256 mintAmount, uint256 mintTokens)",
  "event Redeem(address redeemer, uint256 redeemAmount, uint256 redeemTokens)",
  "event Borrow(address borrower, uint256 borrowAmount, uint256 accountBorrows, uint256 totalBorrows)",
  "event RepayBorrow(address payer, address borrower, uint256 repayAmount, uint256 accountBorrows, uint256 totalBorrows)",
  "event Transfer(address indexed from, address indexed to, uint256 amount)",
  "event Flashloan(address indexed receiver, uint256 amount, uint256 totalFee, uint256 reservesFee)"
]

function provideInitialize(createContract) {
  return async function initialize() {
    comptrollerContract = createContract()
  }
}

async function handleTransaction(txEvent) {
  const accounts = new Set()

  ironBankEventSigs.forEach(eventSig => {
    txEvent.filterLog(eventSig)
      // Check if the event is from Iron Bank address
      .filter(e => marketsAddresses.includes(e.address))
      .map(e => e.args[0]) // args[0] is always the initiating account
      .forEach(e => accounts.add(e))
  })

  let promises = [...accounts].map(account => checkForBadDebt(account))
  const findings = await Promise.all(promises)
  return findings
}

checkForBadDebt = async (account) => {
  const accountLiquidity = await comptrollerContract.getAccountLiquidity(account)
  // getAccountLiquidity returns (possible error code (semi-opaque),
  // account liquidity in excess of collateral requirements,
  // account shortfall below collateral requirements)
  const shortfall = accountLiquidity[2]

  if (shortfall.gt(0)) {
    return Finding.fromObject({
      name: "Account has bad debt",
      description: `Account has bad debt after interacting with the Iron Bank`,
      alertId: "IRON-BANK-BAD-DEBT",
      protocol: "iron-bank",
      severity: FindingSeverity.Medium,
      type: FindingType.Degraded,
      metadata: {
        account,
        shortfall: shortfall.toString(),
      },
    })
  }
}

createContract = () => {
  return new ethers.Contract(COMPTROLLER_ADDRESS, COMPTROLLER_ABI, getEthersProvider())
}

module.exports = {
  provideInitialize,
  initialize: provideInitialize(createContract),
  handleTransaction,
}
