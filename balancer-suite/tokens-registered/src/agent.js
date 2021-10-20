const { Finding, FindingType, FindingSeverity, getJsonRpcUrl } = require("forta-agent")
const { ethers } = require("ethers")

const provider = new ethers.providers.JsonRpcProvider(getJsonRpcUrl())

const VAULT_ADDRESS = "0xba12222222228d8ba445958a75a0704d566bf2c8"
const EVENT_SIGNATURE = "TokensRegistered(bytes32,address[],address[])"

const VAULT_ABI = [
  "function getPool(bytes32) view returns (address, uint8)"
]

const GET_NAME_ABI = [
  "function name() view returns (string)"
]

let vaultContract

function provideHandleInitialize(createContract) {
  return async function initialize() {
    vaultContract = createContract(VAULT_ADDRESS)
  }
}

function provideHandleTransaction(createContract) {
  return async function handleTransaction(txEvent) {
    const findings = []
    const eventLog = txEvent.filterEvent(EVENT_SIGNATURE, VAULT_ADDRESS)

    for (const e of eventLog) {
      const poolId = e.topics[1]
      const poolAddress = (await vaultContract.getPool(poolId))[0]

      const poolContract = createContract(poolAddress)
      const poolName = await poolContract.name()
      
      const { tokens, assetManagers } = decodeData(e.data)

      const tokenNames = []
      for (const token of tokens) {
        const tokenContract = createContract(token)
        const tokenName = await tokenContract.name()
        tokenNames.push(tokenName)
      }

      const tokensString = createTokenString(tokenNames, assetManagers)

      findings.push(Finding.fromObject({
        name: "Balancer Tokens Registered",
        description: `Tokens registered for ${poolName}: ${tokensString}`,
        alertId: "BALANCER-TOKENS-REGISTERED",
        protocol: "balancer",
        severity: FindingSeverity.Medium,
        type: FindingType.Info,
        metadata: {
          poolId,
          tokens,
          assetManagers
        },
      }))
    }

    return findings
  }
}

const decodeData = (data) => {
  return ethers.utils.defaultAbiCoder.decode(["address[] tokens", "address[] assetManagers"], data)
}

const createContract = (address) => {
  const abi = address === VAULT_ADDRESS ? VAULT_ABI : GET_NAME_ABI
  return new ethers.Contract(address, abi, provider)
}

const createTokenString = (tokenNames, assetManagers) => {
  let strings = []
  for (let i = 0; i < tokenNames.length; i++) {
    const assetManager = assetManagers[i] === ethers.constants.AddressZero 
      ? "no AssetManager"
      : `AssetManager ${assetManagers[i]}` 
    strings.push(`${tokenNames[i]} with ${assetManager}`)
  }
  return strings.join(", ")
}

module.exports = {
  provideHandleTransaction,
  handleTransaction: provideHandleTransaction(createContract),
  provideHandleInitialize,
  initialize: provideHandleInitialize(createContract)
}
