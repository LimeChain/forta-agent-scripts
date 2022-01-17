const { Finding, FindingSeverity, FindingType, getEthersProvider, ethers } = require("forta-agent")
const { Contract, Provider } = require('ethers-multicall');

const COMPTROLLER_ADDRESS = "0xab1c342c7bf5ec5f02adea1c2270670bca144cbb"
const ABI = [
  "function getAccountLiquidity(address account) public view returns (uint256, uint256, uint256)"
]
const zero = ethers.constants.Zero
const ACCOUNTS_THRESHOLD = 50

const ethcallProvider = new Provider(getEthersProvider(), 1)
const contract = new Contract(COMPTROLLER_ADDRESS, ABI)

function provideHandleTransaction(ethcallProvider, contract) {
  return async function handleTransaction(txEvent) {
    const findings = []

    const addresses = Object.keys(txEvent.addresses)

    // Skip tx if total addresses are <= than ACCOUNTS_THRESHOLD
    if (addresses.length <= ACCOUNTS_THRESHOLD) return findings

    // Use multicall contract to get all liquidities with only one call
    const calls = addresses.map(a => contract.getAccountLiquidity(a))
    const data = await ethcallProvider.all(calls)

    let accounts = 0
    data.forEach(e => {
      // getAccountLiquidity returns (error, liquidity, shortfall)
      // an account has liquidity in Iron Bank market if it has either liquidity or shortfall
      const [_, liquidity, shortfall] = e
      if (liquidity > zero || shortfall > zero) {
        accounts++
      }
    })

    if (accounts > ACCOUNTS_THRESHOLD) {
      findings.push(Finding.fromObject({
        name: "High number of accounts",
        description: `In the transaction are involved more than ${ACCOUNTS_THRESHOLD} accounts`,
        alertId: "IRON-BANK-HIGH-NUMBER-OF-ACCOUNTS",
        protocol: "iron-bank",
        severity: FindingSeverity.Medium,
        type: FindingType.Suspicious,
      }))
    }

    return findings
  }
}

module.exports = {
  handleTransaction: provideHandleTransaction(ethcallProvider, contract),
  provideHandleTransaction
}
