const { Finding, FindingSeverity, FindingType, ethers, getEthersProvider } = require("forta-agent")
const { Contract, Provider } = require('ethers-multicall')
const { getMarkets } = require("../../helper")

const comptrollerAddress = "0xab1c342c7bf5ec5f02adea1c2270670bca144cbb"
const comptrollerAbi = [ "function getAllMarkets() public view returns (address[] memory)" ]

const abi = [
  "function totalSupply() external view returns (uint256)",
  "function exchangeRateStored() public view returns (uint256)"
]

const eventSig = "event Borrow(address borrower, uint256 borrowAmount, uint256 accountBorrows, uint256 totalBorrows)"
const PERCENTAGE_THRESHOLD = 10

const contracts = {}
let ethcallProvider
let markets

function provideHandleInitialize(getMarkets, createProvider) {
  return async function initialize() {
    markets = await getMarkets()
    for (const address of Object.keys(markets)) {
      contracts[address] = new Contract(address, abi)
    }

    ethcallProvider = createProvider()
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
  const decimalsUnderlying = markets[market].decimalsUnderlying

  const calls = [
    contracts[market].totalSupply(),
    contracts[market].exchangeRateStored()
  ]

  const [ totalSupply, exchangeRate ] = await ethcallProvider.all(calls)

  const totalUnderlyingSupply = totalSupply.mul(exchangeRate)

  // Convert borrowAmount and totalUnderlyingSupply to formated string
  // for the borrowAmount use the decimals of the underlying asset
  // for the totalUnderlyingSupply use decimals + 18 (the exchange rate is always scaled by 1e18)
  const borrowAmountNum = ethers.utils.formatUnits(borrowAmount, decimalsUnderlying)
  const totalUnderlyingSupplyNum = ethers.utils.formatUnits(totalUnderlyingSupply, decimalsUnderlying+18)

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

const createProvider = () => {
  return new Provider(getEthersProvider(), 1)
}

module.exports = {
  provideHandleInitialize,
  initialize: provideHandleInitialize(getMarkets, createProvider),
  handleTransaction
}
