const { Finding, FindingSeverity, FindingType, ethers, getEthersProvider } = require("forta-agent")
const { Contract } = require('ethers-multicall')
const { getMarkets, getProvider } = require("./helper")

const abi = [
  "function totalSupply() external view returns (uint256)",
  "function exchangeRateStored() public view returns (uint256)"
]

const eventSig = "event Borrow(address borrower, uint256 borrowAmount, uint256 accountBorrows, uint256 totalBorrows)"
const PERCENTAGE_THRESHOLD = 10

const contracts = {}
let ethcallProvider
let markets

function provideHandleInitialize(getMarkets, getProvider) {
  return async function initialize() {
    markets = await getMarkets()
    for (const address of Object.keys(markets)) {
      contracts[address] = new Contract(address, abi)
    }

    ethcallProvider = getProvider()
  }
}

async function handleTransaction(txEvent) {
  const findings = []
  const events = txEvent.filterLog(eventSig)
    .filter(e => markets[e.address])

  const calls = events.map(e => [
    contracts[e.address].totalSupply(),
    contracts[e.address].exchangeRateStored()
  ]).flat()

  const data = await ethcallProvider.all(calls)

  events.forEach( (event, i) => {
    const market = event.address
    const { borrower, borrowAmount } = event.args
    const decimalsUnderlying = markets[market].decimalsUnderlying

    // The data has marketsLength * 2 entries
    // The even index is the total supply and the odd index is the exchange rate
    const totalSupply = data[i*2]
    const exchangeRate = data[i*2 + 1]

    const totalUnderlyingSupply = totalSupply.mul(exchangeRate)

    // Convert borrowAmount and totalUnderlyingSupply to formated string
    // for the borrowAmount use the decimals of the underlying asset
    // for the totalUnderlyingSupply use decimals + 18 (the exchange rate is always scaled by 1e18)
    const borrowAmountNum = ethers.utils.formatUnits(borrowAmount, decimalsUnderlying)
    const totalUnderlyingSupplyNum = ethers.utils.formatUnits(totalUnderlyingSupply, decimalsUnderlying+18)

    const percentage = calculatePercentage(borrowAmountNum, totalUnderlyingSupplyNum)

    if (percentage > PERCENTAGE_THRESHOLD) {
      findings.push(createAlert(borrower, borrowAmountNum, totalUnderlyingSupplyNum, market, percentage))
    }
  })

  return findings
}

const createAlert = (borrower, borrowAmount, totalUnderlyingSupply, market, percentage) => {
  return Finding.fromObject({
    name: "Borrow amount close to total supply",
    description: `${borrower} borrowed ${(+borrowAmount).toFixed(2)} from ` + 
        `${markets[market].name} which is close to the total supply ` + 
        `(${(+totalUnderlyingSupply).toFixed(2)}) of the market`,
    alertId: "BORROW-AMOUNT-CLOSE-TO-TOTAL-SUPPLY",
    protocol: "iron-bank",
    severity: FindingSeverity.Medium,
    type: FindingType.Info,
    metadata: {
      borrower,
      market,
      borrowAmount,
      percentage
    },
  })
}

const calculatePercentage = (borrowAmountNum, totalUnderlyingSupplyNum) => {
  return (borrowAmountNum/totalUnderlyingSupplyNum * 100).toFixed(2)
}

module.exports = {
  provideHandleInitialize,
  initialize: provideHandleInitialize(getMarkets, getProvider),
  handleTransaction
}
