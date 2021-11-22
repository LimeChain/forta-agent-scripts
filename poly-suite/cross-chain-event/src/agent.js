const { Finding, FindingType, FindingSeverity, ethers } = require("forta-agent")
const { RequestManager, HTTPTransport, Client } = require("@open-rpc/client-js")
const { chains } = require("./agent-config")

const transport = new HTTPTransport("http://seed1.poly.network:20336")
const client = new Client(new RequestManager([transport]))

const ABI = ["function getEthTxHash(uint256 ethTxHashIndex) public view returns (bytes32)"]
const polyCcmAddress = "0300000000000000000000000000000000000000"
const contracts = {}

let blockHeight = 0

function provideInitialize(client) {
  return async function initialize() {
    blockHeight = await getBlockHeight(client)

    // Initialize the contracts on all chains
    for (const property in chains) {
      const chain = chains[property]
      const provider = new ethers.providers.JsonRpcProvider(chain.provider)
      contracts[property] = new ethers.Contract(chain.ccdAddress, ABI, provider)
    }
  }
}

function provideHandleBlock(client, contracts) {
  return async function handleBlock() {
    let findings = []

    const newBlockHeight = await getBlockHeight(client)
    if (newBlockHeight === blockHeight) return findings

    // Iterate over all blocks from the last checked to the current
    const promises = []
    for (let block = blockHeight + 1; block <= newBlockHeight; block++) {
      promises.push(getEventsByBlockHeight(block, client, contracts));
    }

    findings = (await Promise.all(promises)).flat()
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
  const count = await client.request({ method: "getblockcount", params: [] })
  return count - 1
}

const getEventsByBlockHeight = (block, client, contracts) => new Promise(
  async (resolve) => {
    const findings = []

    // 'getsmartcodeevent' returns an array of events or null if there are no events
    const events = await client.request({ method: "getsmartcodeevent", params: [block] })

    // If there are events, iterate over every event[Notify]
    if (events) {
      for (const event of events) {
        // Every event contains an array of 'Notify' objects
        for (const notify of event["Notify"]) {
          // Every Notify object has a 'ContractAddress' and a
          // 'States' array = [method, srcChainId, dstChainId, txId, blockHeight, key]
          const contractAddress = notify["ContractAddress"]
          if (contractAddress !== polyCcmAddress) continue
          if (notify["States"].length < 6) continue

          const method = notify["States"][0]
          if (method !== "makeProof") continue

          // Skip if there is no provider for the chain
          const srcChainId = notify["States"][1]
          const contract = contracts[srcChainId]
          if (!contract) continue

          // Use the key to get the storage
          const key = notify["States"][5]
          const storage = await client.request({
            method: "getstorage",
            params: [contractAddress, key.substr(40)]
          })

          // The storage contains:
          // txHash on Poly
          // srcChainId
          // makeTxParam (txIndex, crossChainId, fromContractAddress, toChainId, 
          // toContractAddress, method, txData)
          // Only hash the makeTxParam
          const rawData = storage.substr(82)
          const storageHash = ethers.utils.keccak256("0x" + rawData)

          // Get the txIndex from the makeTxParam
          // (skip the first byte, it is for size)
          const crossChainTxIndex = ethers.BigNumber.from("0x" + rawData.substr(2, 64))
          const srcChainHash = await contract.getEthTxHash(crossChainTxIndex.toNumber())

          if (storageHash !== srcChainHash) {
            findings.push(createAlert(event, storageHash, srcChainHash))
          }
        }
      }
    }
    resolve(findings)
  }
)

module.exports = {
  provideHandleBlock,
  handleBlock: provideHandleBlock(client, contracts),
  provideInitialize,
  initialize: provideInitialize(client)
}
