const { Finding, FindingSeverity, FindingType, ethers, getEthersProvider } = require("forta-agent")
const { markets } = require("./iron-bank-markets")

const eventSig = "event Borrow(address borrower, uint256 borrowAmount, uint256 accountBorrows, uint256 totalBorrows)"
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

  // Get only borrow events from Iron Bank markets
  const events = txEvent.filterLog(eventSig)
    .filter(e => marketsAddresses.includes(e.address))

  for(const event of events) {
    const address = event.address
    const borrower = event.args.borrower
    const borrowAmount = ethers.utils.formatEther(event.args.borrowAmount)

    // Get the price of the underlying asset in USD
    const price = ethers.utils.formatEther(await oracleContract.getUnderlyingPrice(address))

    const amount = borrowAmount * price

    if (amount > AMOUNT_THRESHOLD) {
      findings.push(Finding.fromObject({
        name: "Borrow with high amount",
        description: `Address ${borrower} borrowed $${amount.toFixed(2)} from ${getAddressName(address)}`,
        alertId: "IRON-BANK-HIGH-BORROW-AMOUNT",
        protocol: "iron-bank",
        severity: FindingSeverity.Medium,
        type: FindingType.Info,
        metadata: {
          borrower,
          amount,
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
