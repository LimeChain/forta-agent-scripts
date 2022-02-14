const { Finding, FindingSeverity, FindingType, ethers } = require("forta-agent")
const { Contract } = require('ethers-multicall')
const { getMarkets, getProvider } = require("./helper")

const eventSigs = [
  "event Borrow(address borrower, uint256 borrowAmount, uint256 accountBorrows, uint256 totalBorrows)",
  "event Mint (address minter, uint256 mintAmount, uint256 mintTokens)"
]
const oracleAddress = "0x6b96c414ce762578c3e7930da9114cffc88704cb"
const abi = [ "function getUnderlyingPrice(address cToken) public view returns (uint)" ]

const AMOUNT_THRESHOLD = 5_000_000

const oracleContract = new Contract(oracleAddress, abi)

let markets
let ethcallProvider

function provideInitialize(getMarkets, getProvider) {
  return async function initialize() {
    markets = await getMarkets()
    ethcallProvider = getProvider()
  }
}

async function handleTransaction(txEvent) {
  // Get only borrow/mint events from Iron Bank markets
  const events = txEvent.filterLog(eventSigs)
    .filter(e => markets[e.address])
    
  // Use multicall contract to get all prices with only one call
  const calls = events.map(e => oracleContract.getUnderlyingPrice(e.address))
  const prices = await ethcallProvider.all(calls)

  const findings = events.map((event, i) => checkAmount(event, prices[i]))
    .filter(alert => !!alert) // Remove undefined elements

  return findings
}

const checkAmount = (event, price) => {
  const eventName = event.name
  const address = event.address

  // The first argument is the account (minter/borrower)
  const account = event.args[0]

  // The second argument is the amount
  const amount = ethers.utils.formatEther(event.args[1])

  const usdAmount = amount * ethers.utils.formatEther(price)

  if (usdAmount > AMOUNT_THRESHOLD) {
    return new Finding.fromObject({
      name: `${eventName} with high amount`,
      description: `Address ${account} ${eventName.toLowerCase()}ed $${usdAmount.toFixed(2)} from ${markets[address].name}`,
      alertId: `IRON-BANK-HIGH-${eventName.toUpperCase()}-AMOUNT`,
      protocol: "iron-bank",
      severity: FindingSeverity.Medium,
      type: FindingType.Info,
      metadata: {
        account,
        amount: usdAmount,
        market: address
      },
    })
  }
}

module.exports = {
  provideInitialize,
  initialize: provideInitialize(getMarkets, getProvider),
  handleTransaction
}
