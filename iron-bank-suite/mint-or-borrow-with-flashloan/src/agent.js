const { Finding, FindingSeverity, FindingType, ethers } = require("forta-agent")
const { getMarkets } = require("./helper")

const ironBankEventSigs = [
  "event Mint(address minter, uint256 mintAmount, uint256 mintTokens)",
  "event Borrow(address borrower, uint256 borrowAmount, uint256 accountBorrows, uint256 totalBorrows)"
]
const ironBankFlashloanSig = "event Flashloan(address indexed receiver, uint256 amount, uint256 totalFee, uint256 reservesFee)"

const aaveFlashloanSig = "event FlashLoan(address indexed target, address indexed initiator, address indexed asset, uint256 amount, uint256 premium, uint16 referralCode)"
const aaveLendingPoolAddress = "0x7d2768de32b0b80b7a3454c06bdac94a69ddc7a9"

const dydxSoloMarginAddress = "0x1e0447b19bb6ecfdae1e4ae1694b0c3659614e4e"
const dydxEventSigs = [
  "event LogDeposit(address indexed accountOwner, uint256 accountNumber, uint256 market, ((bool sign, uint256 value) deltaWei, tuple(bool sign, uint128 value) newPar) update, address from)",
  "event LogWithdraw(address indexed accountOwner, uint256 accountNumber, uint256 market, ((bool sign, uint256 value) deltaWei, tuple(bool sign, uint128 value) newPar) update, address from)"
]

// Set constants for initial balance
// and fee for dydx operation
const zero = ethers.constants.Zero
const two = ethers.BigNumber.from(2)

let markets
let marketsAddresses

function provideInitialize(getMarkets) {
  return async function initialize() {
    markets = await getMarkets()
    marketsAddresses = Object.keys(markets)
  }
}

async function handleTransaction(txEvent) {
  const findings = []

  const hasMintOrBorrow = txEvent.filterLog(ironBankEventSigs)
    .some(event => marketsAddresses.includes(event.address))
  if (!hasMintOrBorrow) return findings

  const hasIronBankFlashloan = checkForIronBankFlashloan(txEvent)
  const hasAaveFlashloan = checkForAaveFlashloan(txEvent)
  const hasDydxFlashloan = checkForDydxFlashloan(txEvent)

  if (hasIronBankFlashloan || hasAaveFlashloan || hasDydxFlashloan) {
    findings.push(Finding.fromObject({
      name: "Iron Bank interaction and flashloan",
      description: `Iron Bank interaction in the same tx as flashloan`,
      alertId: "IRON-BANK-MARKET-INTERACTION-AND-FLASHLOAN",
      protocol: "iron-bank",
      severity: FindingSeverity.Medium,
      type: FindingType.Info,
    }))
  }

  return findings
}

const checkForIronBankFlashloan = (txEvent) => {
  const events = txEvent.filterLog(ironBankFlashloanSig)
    .some(event => marketsAddresses.includes(event.address))
  return !!events.length
}

const checkForAaveFlashloan = (txEvent) => {
  const events = txEvent.filterLog(aaveFlashloanSig, aaveLendingPoolAddress)
  return !!events.length
}

// Information taken from https://money-legos.studydefi.com/#/dydx
// DyDx doesn't natively support "flashloan" feature.
// However you can achieve a similar behavior by executing a series of operations on 
// the SoloMargin contract. In order mimic an Aave flashloan on DyDx, you would need to:
//  1. Borrow x amount of tokens. (Withdraw)
//  2. Call a function (i.e. Logic to handle flashloaned funds). (Call)
//  3. Deposit back x (+2 wei) amount of tokens. (Deposit)
const checkForDydxFlashloan = (txEvent) => {
  // dydx currently supports 3 markets:
  // 0: WETH
  // 1: DAI
  // 2: USDC
  const balanceDiff = {}

  // Increase the balanceDiff for the specific market on every deposit
  // and decrease it on every withdraw
  txEvent.filterLog(dydxEventSigs, dydxSoloMarginAddress)
    .forEach(event => {
      const market = event.args.market.toNumber()
      const value = event.args.update.deltaWei.value
      const sign = event.args.update.deltaWei.sign

      // Set initial balance difference to 0
      const tempBalance = balanceDiff[market] || zero

      balanceDiff[market] = (sign) ?
        tempBalance.add(value) :
        tempBalance.sub(value)
    })

    // Check if the balance difference for a market is equal to 2
    for ([_, diff] of Object.entries(balanceDiff)) {
      if (diff.eq(two)) {
        return true
      }
    }

  return false
}

module.exports = {
  provideInitialize,
  initialize: provideInitialize(getMarkets),
  handleTransaction
}
