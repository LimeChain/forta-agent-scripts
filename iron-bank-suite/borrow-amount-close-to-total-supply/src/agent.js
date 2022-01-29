const { Finding, FindingSeverity, FindingType, ethers, getEthersProvider } = require("forta-agent")
const { Contract, Provider } = require('ethers-multicall')

const ethcallProvider = new Provider(getEthersProvider(), 1)
const comptrollerAddress = "0xab1c342c7bf5ec5f02adea1c2270670bca144cbb"
const comptrollerAbi = [ "function getAllMarkets() public view returns (address[] memory)" ]

const abi = [
  "function totalSupply() external view returns (uint256)",
  "function exchangeRateStored() public view returns (uint256)"
]

const eventSig = "event Borrow(address borrower, uint256 borrowAmount, uint256 accountBorrows, uint256 totalBorrows)"
const PERCENTAGE_THRESHOLD = 10

const contracts = {}
let markets

function provideHandleInitialize(createContract, getMarkets) {
  return async function initialize() {
    markets = await getMarkets()
    for (const address of Object.keys(markets)) {
      contracts[address] = createContract(address)
    }
  }
}

async function handleTransaction(txEvent) {
  const events = txEvent.filterLog(eventSig)
    .filter(e => markets[e.address])

  const promises = events.map(event => checkAmount(event))
  const findings = (await Promise.all(promises))
    .filter(alert => !!alert) // Remove undefined elements

  return findings
}

const checkAmount = async (event) => {
  const market = event.address
  const { borrower, borrowAmount } = event.args
  const decimals = markets[market].decimals

  const totalSupply = await contracts[market].totalSupply()
  const exchangeRate = await contracts[market].exchangeRateStored()

  const totalUnderlyingSupply = totalSupply.mul(exchangeRate)

  // Convert borrowAmount and totalUnderlyingSupply to formated string
  // for the borrowAmount use the decimals of the underlying asset
  // for the totalUnderlyingSupply use decimals + 18 (the exchange rate is always scaled by 1e18)
  const borrowAmountNum = ethers.utils.formatUnits(borrowAmount, decimals)
  const totalUnderlyingSupplyNum = ethers.utils.formatUnits(totalUnderlyingSupply, decimals+18)

  const percentage = calculatePercentage(borrowAmountNum, totalUnderlyingSupplyNum)

  if (percentage > PERCENTAGE_THRESHOLD) {
    return Finding.fromObject({
      name: "Borrow amount close to total supply",
      description: `${borrower} borrowed ${(+borrowAmountNum).toFixed(2)} from ` + 
          `${markets[market].name} which is close to the total supply ` + 
          `(${(+totalUnderlyingSupplyNum).toFixed(2)}) of the market`,
      alertId: "BORROW-AMOUNT-CLOSE-TO-TOTAL-SUPPLY",
      protocol: "iron-bank",
      severity: FindingSeverity.Medium,
      type: FindingType.Info,
      metadata: {
        borrower,
        market,
        borrowAmount: borrowAmountNum,
        percentage
      },
    })
  }
}

const calculatePercentage = (borrowAmountNum, totalUnderlyingSupplyNum) => {
  return (borrowAmountNum/totalUnderlyingSupplyNum * 100).toFixed(2)
}

const createContract = (address) => {
  return new ethers.Contract(address, abi, getEthersProvider())
}

const getMarkets = async () => {
  const tokenAbi = [ 
    "function symbol() external view returns (string memory)" ,
    "function underlying() public view returns (address)",
    "function decimals() external view returns (uint8)"
  ]

  const contract = new ethers.Contract(comptrollerAddress, comptrollerAbi, getEthersProvider())

  // get the addreses of the markets
  marketsAddresses = (await contract.getAllMarkets())
    .map(address => address.toLowerCase())

  // get their symbols
  let calls = marketsAddresses.map(address => {
    const tokenContract = new Contract(address, tokenAbi)
    return tokenContract.symbol()
  })

  const symbols = await ethcallProvider.all(calls)

  // get the addresses of the underlying assets
  calls = marketsAddresses.map(address => {
    const tokenContract = new Contract(address, tokenAbi)
    return tokenContract.underlying()
  })

  const underlyingAddress = await ethcallProvider.all(calls)

  // get the decimals of the underlying assets
  calls = underlyingAddress.map(address => {
    const tokenContract = new Contract(address, tokenAbi)
    return tokenContract.decimals()
  })

  const decimals = await ethcallProvider.all(calls)

  // We construct the markets object.
  // The key is the market's address 
  // the object contains its name (symbol) and the decimals of the underlying asset
  const markets = {}
  marketsAddresses.forEach((market, i) => {
    markets[market] = { name: symbols[i], decimals: decimals[i] }
  })
  return markets
}

module.exports = {
  provideHandleInitialize,
  initialize: provideHandleInitialize(createContract, getMarkets),
  handleTransaction
}
