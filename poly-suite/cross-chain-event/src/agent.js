const { Finding, FindingType, FindingSeverity } = require("forta-agent")
const { RequestManager, HTTPTransport, Client } = require("@open-rpc/client-js")
const { ethers } = require("ethers")
const { chains } = require("./agent-config")

const transport = new HTTPTransport("http://seed1.poly.network:20336")
const client = new Client(new RequestManager([transport]))

const ABI = [
  "function getEthTxHash(uint256 ethTxHashIndex) public view returns (bytes32)"
]

const polyCcmAddress = "0300000000000000000000000000000000000000"

const contracts = {}

for (const property in chains) {
  const chain = chains[property]
  const provider = new ethers.providers.JsonRpcProvider(chain.provider)
  contracts[property] = new ethers.Contract(chain.ccdAddress, ABI, provider)
}

let blockHeight = 0

function provideInitialize(client) {
  return async function initialize() {
    blockHeight = await getBlockHeight(client)
  }
}

function provideHandleBlock(client, contracts) {
  return async function handleBlock() {
    const findings = []
    
    const newBlockHeight = await getBlockHeight(client)
    if (newBlockHeight === blockHeight) return findings

    for (let block = blockHeight + 1; block <= newBlockHeight; block++) {
      const events = await client.request({method: "getsmartcodeevent", params: [block]})
      if (!events) continue

      for (const event of events) {
        for (const notify of event["Notify"]) {
          const contractAddress = notify["ContractAddress"]
          if (contractAddress !== polyCcmAddress) continue
          if (notify["States"].length < 6) continue

          const method = notify["States"][0]
          if (method !== "makeProof") continue

          const srcChainId = notify["States"][1]
          const contract = contracts[srcChainId]
          if (!contract) continue

          const key = notify["States"][5]
          const storage = await client.request({
            method: "getstorage", 
            params: [contractAddress, key.substr(40)]
          })

          const rawData = storage.substr(82)
          const storageHash = ethers.utils.keccak256("0x" + rawData)

          const crossChainTxIndex = ethers.BigNumber.from("0x" + rawData.substr(2, 64))
          const srcChainHash = await contract.getEthTxHash(crossChainTxIndex.toNumber())

          if (storageHash !== srcChainId) {
            findings.push(createAlert(event, storageHash, srcChainHash))
          }
        }
      }
    }
    blockHeight = newBlockHeight
    return findings
  }
}

const createAlert = (event, storageHash, srcChainHash) => {
  return Finding.fromObject({
    name: "Poly Cross Chain Event With Wrong Parameters",
    description: `The parameters of the CrossChainEvent and the poly storage are different`,
    alertId: "POLY-CROSS-CHAIN-EVENT-WRONG-PARAMS",
    protocol: "poly",
    severity: FindingSeverity.Critical,
    type: FindingType.Exploit,
    metadata: {
      txHash: event['TxHash'],
      storageHash,
      srcChainHash
    },
  })
}

const getBlockHeight = async (client) => {
  const count = await client.request({method: "getblockcount", params: []})
  return count - 1
}

module.exports = {
  provideHandleBlock,
  handleBlock: provideHandleBlock(client, contracts),
  provideInitialize,
  initialize: provideInitialize(client)
}
