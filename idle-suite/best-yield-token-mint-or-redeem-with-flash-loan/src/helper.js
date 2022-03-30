const { ethers, getEthersProvider } = require("forta-agent")
const { Contract, Provider } = require('ethers-multicall')

const comptrollerAbi = [ "function getAllMarkets() public view returns (address[] memory)" ]

const idleControllerAddress = "0x275DA8e61ea8E02d51EDd8d0DC5c0E62b4CDB0BE"
const idleControllerContract = new ethers.Contract(idleControllerAddress, comptrollerAbi, getEthersProvider())
const ethcallProvider = new Provider(getEthersProvider(), 1)
const marketAbi = [ "function symbol() external view returns (string memory)" ]
let idleMarkets = {}

module.exports = {
    init: async () => {
        // Init Idle finance markets
        const idleMarketsAddresses = await idleControllerContract.getAllMarkets()
        const idleContracts = idleMarketsAddresses.map(address => new Contract(address, marketAbi))

        const symbolsCalls = idleContracts.map(contract => contract.symbol())
        const symbols = await ethcallProvider.all(symbolsCalls)

        idleMarketsAddresses.forEach((address, i) => {
            const lowercaseAddress = address.toLowerCase()
            idleMarkets[lowercaseAddress] = {
                symbol: symbols[i],
            }
        })
    },
    getMarkets: () => {
        return idleMarkets
    },
    getAction: (interactions) => {
        const actions = new Map()
        interactions.map(i => i.type).forEach(action => actions.set(action, true))
        const hasMints = actions.get("Mint")
        const hasBorrows = actions.get("Redeem")

        if (hasMints && hasBorrows) return "Mint and Redeem"
        else if (hasMints && !hasBorrows) return "Mint"
        else if (!hasMints && hasBorrows) return "Redeem"
        else return null
    },
}
