const {
  FindingType,
  FindingSeverity,
  Finding,
  createTransactionEvent,
} = require("forta-agent")
const { ethers } = require("ethers")

const { provideHandleTransaction, provideHandleInitialize } = require("./agent")

const vaultAddress = "0xBA12222222228d8Ba445958a75a0704d566BF2C8"
const eventTopic = "0xf5847d3f2197b16cdcd2098ec95d0905cd1abdaf415f07bb7cef2bba8ac5dec4"

const poolId = "0x6ac02ecd0c2a23b11f9afb3b3aaf237169475cac0002000000000000000000a8"
const poolAddress = "0x6ac02ecd0c2a23b11f9afb3b3aaf237169475cac"
const poolName = "Pool Name"

const token1Name = "Token1"
const token2Name = "Token2"
const token1Address = "0x194eBd173F6cDacE046C53eACcE9B953F28411d1"
const token2Address = "0x2A8f5649DE50462fF9699Ccc75A2Fb0b53447503"

// Two tokens with no asset managers
// Taken from tx 0xc511bcf50134fe53537a2c58c8d8016fcac59fac5420afb932fc27bbea9282be
const data = 
"0x0000000000000000000000000000000000000000000000000000000000000040"+
"00000000000000000000000000000000000000000000000000000000000000a0"+
"0000000000000000000000000000000000000000000000000000000000000002"+
"000000000000000000000000194ebd173f6cdace046c53eacce9b953f28411d1"+
"0000000000000000000000002a8f5649de50462ff9699ccc75a2fb0b53447503"+
"0000000000000000000000000000000000000000000000000000000000000002"+
"0000000000000000000000000000000000000000000000000000000000000000"+
"0000000000000000000000000000000000000000000000000000000000000000"

const logsMatchEvent = {
  address: vaultAddress,
  topics: [ eventTopic, poolId ],
  data: data
}
const logsNoMatchEvent = {
  address: vaultAddress,
  topics: [ '0x0' ],
}

describe("tokens registered agent", () => {
  let handleTransaction

  const mockContract = {
    getPool: jest.fn(),
    name: jest.fn()
  }

  const mockCreateContract = () => mockContract

  const createTxEvent = ({ logs, addresses }) =>
    createTransactionEvent({
      receipt: { logs },
      addresses,
    })

  beforeAll(() => {
    initialize = provideHandleInitialize(mockCreateContract)
    handleTransaction = provideHandleTransaction(mockCreateContract)
  })

  describe("handleTransaction", () => {
    it("returns empty findings if no TokensRegistered event", async () => {
      const txEvent = createTxEvent({
        logs: [logsNoMatchEvent],
        addresses: { [vaultAddress]: true },
      })

      await initialize()
      const findings = await handleTransaction(txEvent)

      expect(findings).toStrictEqual([])
    })

    it("returns a finding on TokensRegistered event", async () => {
      const txEvent = createTxEvent({
        logs: [logsMatchEvent],
        addresses: { [vaultAddress]: true },
      })

      mockContract.getPool.mockReturnValueOnce(poolAddress)
      mockContract.name.mockReturnValueOnce(poolName)
      mockContract.name.mockReturnValueOnce(token1Name)
      mockContract.name.mockReturnValueOnce(token2Name)

      await initialize()
      const findings = await handleTransaction(txEvent)

      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: "Balancer Tokens Registered",
          description: `Tokens registered for ${poolName}: ${token1Name} with no AssetManager, ${token2Name} with no AssetManager`,
          alertId: "BALANCER-TOKENS-REGISTERED",
          protocol: "balancer",
          type: FindingType.Info,
          severity: FindingSeverity.Medium,
          metadata: {
            poolId,
            tokens: [ token1Address, token2Address ],
            assetManagers: [ ethers.constants.AddressZero, ethers.constants.AddressZero ]
          },
        }),
      ])
    })
  })
})
