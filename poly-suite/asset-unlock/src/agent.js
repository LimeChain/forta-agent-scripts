const { Finding, FindingType, FindingSeverity } = require("forta-agent")
const { RequestManager, HTTPTransport, Client } = require("@open-rpc/client-js")
const { ethers } = require("ethers")

const transport = new HTTPTransport("http://seed1.poly.network:20336")
const client = new Client(new RequestManager([transport]))

const LOCK_PROXY_ADDRESS = "0x250e76987d838a75310c34bf422ea9f1ac4cc906"
const ECCM_ADDRESS = "0x14413419452aaf089762a0c5e95ed2a13bbc488c"

const UNLOCK_EVENT_SIGNATURE = "event UnlockEvent(address toAssetHash, address toAddress, uint256 amount)"
const VERIFY_HEADER_EVENT_SIGNATURE = "event VerifyHeaderAndExecuteTxEvent(uint64 fromChainID, bytes toContract, bytes crossChainTxHash, bytes fromChainTxHash)"

function provideHandleTransaction(getPolyStorageValues) {
  return async function handleTransaction(txEvent) {
    const findings = []
    const unlockEvents = txEvent.filterLog(UNLOCK_EVENT_SIGNATURE, LOCK_PROXY_ADDRESS)

    // We use the index to get the correct VerifyHeaderAndExecuteTxEvent
    for (const [i, unlockEvent] of unlockEvents.entries()) {
      const { toAssetHash, toAddress, amount } = unlockEvent.args

      const verifyHeaderEvent = txEvent.filterLog(VERIFY_HEADER_EVENT_SIGNATURE, ECCM_ADDRESS)[i]
      const { crossChainTxHash } = verifyHeaderEvent.args
  
      const { polyAsset, polyAddress, polyAmount } = await getPolyStorageValues(crossChainTxHash)
  
      if (
        toAssetHash.toLowerCase() !== polyAsset ||
        toAddress.toLowerCase() !== polyAddress ||
        !amount.eq(polyAmount)
        ) {
        findings.push(Finding.fromObject({
          name: "Poly UnlockEvent With Wrong Parameters",
          description: `The parameters of the UnlockEvent and the poly storage are different`,
          alertId: "POLY-ASSET-UNLOCK-WRONG-PARAMS",
          protocol: "poly",
          severity: FindingSeverity.Critical,
          type: FindingType.Exploit,
          metadata: {
            unlockEventParams: { toAssetHash, toAddress, amount },
            polyStorageParams: { polyAsset, polyAddress, polyAmount },
          },
        }))
      }
    }
    return findings
  }
}

async function getPolyStorageValues(crossChainTxHash) {
  const txHash = hexStringReverse(crossChainTxHash.substr(2))
  const event = await client.request({method: "getsmartcodeevent", params: [txHash]})

  const notify = event["Notify"][0]
  const contractAddress = notify["ContractAddress"]
  const key = notify["States"][5]

  const storage = await client.request({method: "getstorage", params: [contractAddress, key.substr(40)]})

  // We parse only the fields we need
  let usefulData = storage.substr(332)
  const polyAsset = "0x" + usefulData.substr(0, 40)
  const polyAddress = "0x" + usefulData.substr(42, 40) // +2 chars (1 byte) for size
  const amount = usefulData.substr(82)
  const polyAmount = ethers.BigNumber.from("0x" + hexStringReverse(amount))
  
  return { polyAsset, polyAddress, polyAmount }
}

const hexStringReverse = (string) => {
  return string.match(/[a-fA-F0-9]{2}/g).reverse().join('')
}

module.exports = {
  provideHandleTransaction,
  handleTransaction: provideHandleTransaction(getPolyStorageValues),
}
