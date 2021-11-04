const { ethers } = require("ethers")
const {
  FindingType,
  FindingSeverity,
  Finding,
  createTransactionEvent,
} = require("forta-agent")

const { provideHandleInitialize, handleTransaction } = require("./agent")

const vaultAddress = "0xBA12222222228d8Ba445958a75a0704d566BF2C8"
const poolId = "0x01abc00e86c7e258823b9a055fd62ca6cf61a16300010000000000000000003b"
const fromAddress = "0x3709eA03772585AA799eecb095102A7fe1514FAe"
const fromAddressEncoded = "0x0000000000000000000000003709ea03772585aa799eecb095102a7fe1514fae"
const eventTopic = "0xe5ce249087ce04f05a957192435400fd97868dba0e6a4b4c049abf8af80dae78"

const token = "0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e"
const delta = ethers.utils.parseUnits("1")
const balance = ethers.utils.parseUnits("11")
const data = ethers.utils.defaultAbiCoder.encode([
  "address[] tokens", "uint256[] deltas", "uint256[] protocolFeeAmounts"],
  [[token], [delta], [0]])

const logsMatchEvent = {
  address: vaultAddress,
  topics: [ eventTopic, poolId, fromAddressEncoded ],
  data: data
}
const logsNoMatchEvent = {
  address: vaultAddress,
  topics: [ '0x0' ],
}

describe("TVL drastic change agent", () => {
  let initialize

  const mockContract = {
    getPoolTokens: jest.fn()
  }

  const mockCreateContract = () => mockContract

  const createTxEvent = ({ logs }) =>
    createTransactionEvent({
      receipt: { logs },
      vaultAddress,
    })

  beforeAll(async () => {
    initialize = provideHandleInitialize(mockCreateContract)
    await initialize()
  })

  describe("handleTransaction", () => {
    it("returns empty findings if no PoolBalanceChanged event", async () => {
      const txEvent = createTxEvent({
        logs: [logsNoMatchEvent],
      })

      const findings = await handleTransaction(txEvent)

      expect(findings).toStrictEqual([])
    })

    it("returns a finding on PoolBalanceChanged event", async () => {
      const txEvent = createTxEvent({
        logs: [logsMatchEvent],
      })

      mockContract.getPoolTokens.mockReturnValueOnce([[token], [balance]])
      const findings = await handleTransaction(txEvent)

      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: "Balancer Pool TVL drastic change",
          description: `Pool ${poolId} has drastic change in ${token} balance: 10.00%`,
          alertId: "BALANCER-TVL-DRASTIC-CHANGE",
          protocol: "balancer",
          type: FindingType.Suspicious,
          severity: FindingSeverity.Medium,
          metadata: {
            poolId,
            token,
            percentageDiff: "10.00",
            liquidityProvider: fromAddress
          },
        }),
      ])
    })
  })
})
