const {
  FindingType,
  FindingSeverity,
  Finding,
  createTransactionEvent,
} = require("forta-agent")
const { ethers } = require("ethers")

const { provideHandleTransaction } = require("./agent")

const toAssetHash = "0x000000000000000000000000000000000000aaaa"
const toAddress = "0x000000000000000000000000000000000000aadd"
const amount = ethers.BigNumber.from(100)

const polyAsset = "0x00000000000000000000000000000000aaaaaaaa"
const polyAddress = "0x00000000000000000000000000000000aaddaadd"
const polyAmount = ethers.BigNumber.from(10)

const crossChainTxHash = "0x000000000000000000000000000000000000cccc"
const fromChainTxHash = "0x000000000000000000000000000000000000fcfc"

const lockProxyAddress = "0x250e76987d838a75310c34bf422ea9f1ac4cc906"
const eccmAddress = "0x14413419452aaf089762a0c5e95ed2a13bbc488c"

const unlockEventTopic = "0xd90288730b87c2b8e0c45bd82260fd22478aba30ae1c4d578b8daba9261604df"
const verifyHeaderEventTopic = "0x8a4a2663ce60ce4955c595da2894de0415240f1ace024cfbff85f513b656bdae"

const unlockEventData = ethers.utils.defaultAbiCoder.encode([
  "address toAssethash", "address toAddress", "uint256 amount"],
  [toAssetHash, toAddress, amount])

const verifyHeaderEventData = ethers.utils.defaultAbiCoder.encode([
  "uint64 fromChainID", "bytes toContract", "bytes crossChainTxHash", "bytes fromChainTxHash"],
  [6, lockProxyAddress, crossChainTxHash, fromChainTxHash])

const logsMatchUnlockEvent = {
  address: lockProxyAddress,
  topics: [ unlockEventTopic ],
  data: unlockEventData
}
const logsMatchVerifyHeaderEvent = {
  address: eccmAddress,
  topics: [ verifyHeaderEventTopic ],
  data: verifyHeaderEventData
}
const logsNoMatchEvent = {
  address: lockProxyAddress,
  topics: [ '0x0' ],
}

describe("asset unlock agent", () => {
  let handleTransaction

  const mock = jest.fn()

  const createTxEvent = ({ logs, addresses, from }) =>
    createTransactionEvent({
      receipt: { logs },
      addresses,
      transaction: {
        from
      }
    })

  beforeAll(() => {
    handleTransaction = provideHandleTransaction(mock)
  })

  describe("handleTransaction", () => {
    it("returns empty findings if no SwapEnabledSet event", async () => {
      const txEvent = createTxEvent({
        logs: [logsNoMatchEvent],
        addresses: { [lockProxyAddress]: true },
      })

      const findings = await handleTransaction(txEvent)

      expect(findings).toStrictEqual([])
    })

    it("returns a finding on SwapEnabledSet event with state 'true'", async () => {
      const txEvent = createTxEvent({
        logs: [logsMatchUnlockEvent, logsMatchVerifyHeaderEvent],
        addresses: { [lockProxyAddress]: true, [eccmAddress]: true },
      })

      mock.mockReturnValueOnce({polyAsset, polyAddress, polyAmount})
      const findings = await handleTransaction(txEvent)

      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: "Poly UnlockEvent With Wrong Parameters",
          description: `The parameters of the UnlockEvent and the poly storage are different`,
          alertId: "POLY-ASSET-UNLOCK-WRONG-PARAMS",
          protocol: "poly",
          type: FindingType.Exploit,
          severity: FindingSeverity.Critical,
          metadata: {
            unlockEventParams: { toAssetHash, toAddress, amount },
            polyStorageParams: { polyAsset, polyAddress, polyAmount },
          },
        }),
      ])
    })
  })
})
