const { ethers, getEthersProvider } = require("forta-agent")
const { Contract, Provider } = require('ethers-multicall')

const comptrollerAbi = [ "function getAllMarkets() public view returns (address[] memory)" ]

const zero = ethers.constants.Zero
const two = ethers.BigNumber.from(2)

// Idle Finance
const idleControllerAddress = "0x275DA8e61ea8E02d51EDd8d0DC5c0E62b4CDB0BE"
const idleControllerContract = new ethers.Contract(idleControllerAddress, comptrollerAbi, getEthersProvider())
const ethcallProvider = new Provider(getEthersProvider(), 1)
const marketAbi = [ "function symbol() external view returns (string memory)" ]
let idleMarkets = {}

// Iron Bank
const ironBankControllerAddress = "0xab1c342c7bf5ec5f02adea1c2270670bca144cbb"
const ironBankControllerContract = new ethers.Contract(ironBankControllerAddress, comptrollerAbi, getEthersProvider())
const ironBankFlashloanSig = "event Flashloan(address indexed receiver, uint256 amount, uint256 totalFee, uint256 reservesFee)"
let ironBankMarketsAddresses = []

// Aave
const aaveFlashloanSig = "event FlashLoan(address indexed target, address indexed initiator, address indexed asset, uint256 amount, uint256 premium, uint16 referralCode)"
const aaveLendingPoolAddress = "0x7d2768de32b0b80b7a3454c06bdac94a69ddc7a9"

// dYdX
const dydxSoloMarginAddress = "0x1e0447b19bb6ecfdae1e4ae1694b0c3659614e4e"
const dydxEventSigs = [
  "event LogDeposit(address indexed accountOwner, uint256 accountNumber, uint256 market, ((bool sign, uint256 value) deltaWei, tuple(bool sign, uint128 value) newPar) update, address from)",
  "event LogWithdraw(address indexed accountOwner, uint256 accountNumber, uint256 market, ((bool sign, uint256 value) deltaWei, tuple(bool sign, uint128 value) newPar) update, address from)"
]

// MakerDAO
const makerFlashLenderAddress = "0x1EB4CF3A948E7D72A198fe073cCb8C7a948cD853"
const makerFlashloanSig = "event FlashLoan(address indexed receiver, address token, uint256 amount, uint256 fee)"

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

        // Init Iron Bank markets
        ironBankMarketsAddresses = await ironBankControllerContract.getAllMarkets()
    },
    getMarkets: () => {
        return idleMarkets
    },
    setMarkets: (markets) => {
        idleMarkets = markets
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
    hasIronBankFlashloan: (txEvent) => {
        const events = txEvent.filterLog(ironBankFlashloanSig, ironBankMarketsAddresses)
        return !!events.length
    },
    hasAaveFlashloan: (txEvent) => {
        const events = txEvent.filterLog(aaveFlashloanSig, aaveLendingPoolAddress)
        return !!events.length
    },
    hasDydxFlashloan: (txEvent) => {
        // https://money-legos.studydefi.com/#/dydx
        // dydx currently supports 3 markets:
        // 0: WETH
        // 1: DAI
        // 2: USDC
        const balanceDiff = {}

        // Increase the balanceDiff for the specific market on every deposit
        // and decrease it on every withdraw
        txEvent.filterLog(dydxEventSigs, dydxSoloMarginAddress)
            .forEach(event => {
            const market = event.args.market.toNumber()
            const value = event.args.update.deltaWei.value
            const sign = event.args.update.deltaWei.sign

            // Set initial balance difference to 0
            const tempBalance = balanceDiff[market] || zero

            balanceDiff[market] = (sign) ?
                tempBalance.add(value) :
                tempBalance.sub(value)
        })

        // Check if the balance difference for a market is equal to 2
        for ([_, diff] of Object.entries(balanceDiff)) {
            if (diff.eq(two)) {
                return true
            }
        }

        return false
    },
    hasMakerFlashloan: (txEvent) => {
        const events = txEvent.filterLog(makerFlashloanSig, makerFlashLenderAddress)
        return !!events.length
    }
}
