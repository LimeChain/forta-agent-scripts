const { ethers, getEthersProvider } = require("forta-agent")
const { Contract, Provider } = require('ethers-multicall')

const comptrollerAddress = "0xab1c342c7bf5ec5f02adea1c2270670bca144cbb"
const comptrollerAbi = [ 
    "function getAllMarkets() public view returns (address[] memory)",
    "function oracle() public view returns (address oracle)"
]
const ethcallProvider = new Provider(getEthersProvider(), 1)
const contract = new ethers.Contract(comptrollerAddress, comptrollerAbi, getEthersProvider())


module.exports = {
    getMarkets: async () => {
        const tokenAbi = [
            "function symbol() external view returns (string memory)",
            "function underlying() public view returns (address)",
            "function decimals() external view returns (uint8)"
        ]

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
            markets[market] = { name: symbols[i], decimalsUnderlying: decimals[i] }
        })
        return markets
    },
    getOracle: async () => {
        return await contract.oracle()
    },
    getProvider: () => {
        return ethcallProvider
    }
}
