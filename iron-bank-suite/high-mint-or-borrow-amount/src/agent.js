const { Finding, FindingSeverity, FindingType, ethers, getEthersProvider } = require("forta-agent")
const { markets } = require("./iron-bank-markets")
const { Contract, Provider } = require('ethers-multicall')

const eventSigs = [
  "event Borrow(address borrower, uint256 borrowAmount, uint256 accountBorrows, uint256 totalBorrows)",
  "event Mint (address minter, uint256 mintAmount, uint256 mintTokens)"
]
const oracleAddress = "0x6b96c414ce762578c3e7930da9114cffc88704cb"
const abi = [ "function getUnderlyingPrice(address cToken) public view returns (uint)" ]

const marketsAddresses = Object.values(markets)
const AMOUNT_THRESHOLD = 5_000_000

let ethcallProvider
const oracleContract = new Contract(oracleAddress, abi)

function provideInitialize(createProvider) {
  return async function initialize() {
    ethcallProvider = createProvider()
  }
}

async function handleTransaction(txEvent) {
  // Get only borrow/mint events from Iron Bank markets
  const events = txEvent.filterLog(eventSigs)
    .filter(e => marketsAddresses.includes(e.address))
    
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
      description: `Address ${account} ${eventName.toLowerCase()}ed $${usdAmount.toFixed(2)} from ${getAddressName(address)}`,
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

createProvider = () => {
  return new Provider(getEthersProvider(), 1)
}

const getAddressName = (address) => {
  for (const [key, value] of Object.entries(markets)) {
    if (address === value) return key
  }
}

module.exports = {
  provideInitialize,
  initialize: provideInitialize(createProvider),
  handleTransaction
}
