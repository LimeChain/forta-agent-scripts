const { ethers, getEthersProvider } = require("forta-agent")
const { Contract, Provider } = require('ethers-multicall')

const controllerAddress = "0x275DA8e61ea8E02d51EDd8d0DC5c0E62b4CDB0BE"
const controllerAbi = ["function getAllMarkets() public view returns (address[] memory)"]
const contract = new ethers.Contract(controllerAddress, controllerAbi, getEthersProvider())

const ethcallProvider = new Provider(getEthersProvider(), 1)

const marketAbi = [
    "function symbol() external view returns (string memory)",
    "function token() external view returns (address)",
    "function tokenPrice() external view returns (uint256 price)"
]
  
  const tokenAbi = [
    "function decimals() external view returns (uint8)"
]

function getTokenPrices(contracts) {
    const tokenPriceCalls = contracts.map(contract => contract.tokenPrice())
    return ethcallProvider.all(tokenPriceCalls)
}

module.exports = {
    getMarkets: async () => {
        const marketsAddresses = await contract.getAllMarkets()
        const contracts = marketsAddresses.map(address => new Contract(address, marketAbi))

        // Get the pool's symbol
        const symbolsCalls = contracts.map(contract => contract.symbol())
        const symbols = await ethcallProvider.all(symbolsCalls)

        // Get the underlying token
        const tokenCalls = contracts.map(contract => contract.token())
        const tokens = await ethcallProvider.all(tokenCalls)
        const tokenContracts = tokens.map(address => new Contract(address, tokenAbi))

        // Get the decimals of the underlying token
        const decimalsCalls = tokenContracts.map(contract => contract.decimals())
        const decimals = await ethcallProvider.all(decimalsCalls)

        const prices = await getTokenPrices(contracts)

        const markets = symbols.map((symbol, i) => {
            return {
                symbol,
                contract: contracts[i],
                decimals: decimals[i],
                oldPrice: prices[i]
            }
        })

        return markets
    },
    getTokenPrices,
}
