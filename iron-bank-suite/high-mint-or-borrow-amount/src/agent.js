const { Finding, FindingSeverity, FindingType, ethers, getEthersProvider } = require("forta-agent")
const { markets } = require("./iron-bank-markets")

const eventSigs = [
  "event Borrow(address borrower, uint256 borrowAmount, uint256 accountBorrows, uint256 totalBorrows)",
  "event Mint (address minter, uint256 mintAmount, uint256 mintTokens)"
]
const oracleAddress = "0x6b96c414ce762578c3e7930da9114cffc88704cb"
const abi = [ "function getUnderlyingPrice(address cToken) public view returns (uint)" ]

const marketsAddresses = Object.values(markets)
const AMOUNT_THRESHOLD = 5_000_000

let oracleContract

function provideInitialize(createContract) {
  return async function initialize() {
    oracleContract = createContract()
  }
}

async function handleTransaction(txEvent) {
  const findings = []

  // Get only borrow/mint events from Iron Bank markets
  const events = txEvent.filterLog(eventSigs)
    .filter(e => marketsAddresses.includes(e.address))
    

  for(const event of events) {
    const eventName = event.name
    const address = event.address

    // The first argument is the account (minter/borrower)
    const account = event.args[0]

    // The second argument is the amount
    const amount = ethers.utils.formatEther(event.args[1])

    // Get the price of the underlying asset in USD
    const price = ethers.utils.formatEther(await oracleContract.getUnderlyingPrice(address))

    const usdAmount = amount * price

    if (usdAmount > AMOUNT_THRESHOLD) {
      findings.push(Finding.fromObject({
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
      }))
    }
  }

  return findings
}

createContract = () => {
  return new ethers.Contract(oracleAddress, abi, getEthersProvider())
}

const getAddressName = (address) => {
  for (const [key, value] of Object.entries(markets)) {
    if (address === value) return key
  }
}

module.exports = {
  provideInitialize,
  initialize: provideInitialize(createContract),
  handleTransaction
}
