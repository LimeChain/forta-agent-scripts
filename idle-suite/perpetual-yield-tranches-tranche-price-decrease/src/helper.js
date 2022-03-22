const { getEthersProvider } = require("forta-agent")
const axios = require("axios")
const { Contract, Provider } = require('ethers-multicall')

const ethcallProvider = new Provider(getEthersProvider(), 1)

const theGraphApiUrl = "https://api.thegraph.com/subgraphs/name/samster91/idle-tranches"
const payload = {
  query: `{
        cdos {
          id
          AATrancheToken {
            id
          }
          BBTrancheToken {
            id
          }
        }
      }`
}

const cdoAbi = [
  "function strategyToken() external view returns (address)",
  "function tranchePrice(address _tranche) external view returns (uint256)"
]

const tokenAbi = [
  "function symbol() external view returns (string memory)",
  "function decimals() external view returns (uint8)"
]

// For each CDO get the tranchePrice for the AA and the BB tranches
async function getTranchePrices(cdos) {
  const tokenPriceCalls = cdos.map(cdo => {
    const contract = cdo.contract
    return [
      contract.tranchePrice(cdo["AATrancheToken"].id),
      contract.tranchePrice(cdo["BBTrancheToken"].id)
    ]
  }).flat()
  return ethcallProvider.all(tokenPriceCalls)
}

module.exports = {
  getCdos: async () => {
    // Get all CDOs from the subgraph
    const response = await axios.post(theGraphApiUrl, JSON.stringify(payload))
    const cdos = response.data.data.cdos
    const cdoContracts = cdos.map(cdo => new Contract(cdo.id, cdoAbi))

    // Get the strategyToken for each CDO
    const strategyTokenCalls = cdoContracts.map(contract => contract.strategyToken())
    const strategyTokens = await ethcallProvider.all(strategyTokenCalls)
    const tokenContracts = strategyTokens.map(address => new Contract(address, tokenAbi))

    // Get The symbol of the strategyToken
    const tokenSymbolCalls = tokenContracts.map(contract => contract.symbol())
    const tokenSymbols = await ethcallProvider.all(tokenSymbolCalls)

    // Get the decimals of the underlying token
    const decimalsCalls = tokenContracts.map(contract => contract.decimals())
    const decimals = await ethcallProvider.all(decimalsCalls)

    cdos.forEach((cdo, i) => {
      cdo.contract = cdoContracts[i]
      cdo.tokenSymbol = tokenSymbols[i]
      cdo.tokenDecimals = decimals[i]
    })

    const prices = await getTranchePrices(cdos)

    cdos.forEach((cdo, i) => {
      cdo["AATrancheToken"].oldPrice = prices[2 * i]
      cdo["BBTrancheToken"].oldPrice = prices[2 * i + 1]
    })

    return cdos
  },
  getTranchePrices,
}
