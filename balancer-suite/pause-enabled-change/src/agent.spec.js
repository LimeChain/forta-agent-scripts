const {
  FindingType,
  FindingSeverity,
  Finding,
  createTransactionEvent,
} = require("forta-agent")

const { provideHandleTransaction } = require("./agent")

const vaultAddress = "0xBA12222222228d8Ba445958a75a0704d566BF2C8"
const poolAddress = "0x1111"
const eventTopic = "0x5a9e84f78f7957cb4ed7478eb0fcad35ee4ecbe2e0f298420b28a3955392573f"
const dataTrue = "0x0000000000000000000000000000000000000000000000000000000000000001"
const dataFalse = "0x0000000000000000000000000000000000000000000000000000000000000000"

const logsMatchEventPaused = {
  address: poolAddress,
  topics: [ eventTopic ],
  data: dataTrue
}
const logsMatchEventUnpaused = {
  address: poolAddress,
  topics: [ eventTopic ],
  data: dataFalse
}
const logsNoMatchEvent = {
  address: poolAddress,
  topics: [ '0x0' ],
}

describe("pause state change agent", () => {
  let handleTransaction

  const mockContract = {
    getVault: jest.fn()
  }

  const mockCreateContract = () => mockContract

  const createTxEvent = ({ logs, addresses }) =>
    createTransactionEvent({
      receipt: { logs },
      addresses
    })

  beforeAll(() => {
    handleTransaction = provideHandleTransaction(mockCreateContract)
  })

  describe("handleTransaction", () => {
    it("returns empty findings if no PausedStateChanged event", async () => {
      const txEvent = createTxEvent({
        logs: [logsNoMatchEvent],
        addresses: { [poolAddress]: true }
      })

      const findings = await handleTransaction(txEvent)

      expect(findings).toStrictEqual([])
    })

    it("returns a finding on SwapEnabledSet event with state 'true'", async () => {
      const txEvent = createTxEvent({
        logs: [logsMatchEventPaused],
        addresses: { [poolAddress]: true, [vaultAddress]: true }
      })

      mockContract.getVault.mockReturnValueOnce(vaultAddress)
      const findings = await handleTransaction(txEvent)

      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: "Balancer Pool Swap Enabled Changed",
          description: `Swaps for pool ${poolAddress} are enabled`,
          alertId: "BALANCER-SWAP-ENABLED-CHANGED",
          type: FindingType.Suspicious,
          severity: FindingSeverity.Medium,
          metadata: {
            address: poolAddress,
            swapEnabled: true,
          },
        }),
      ])
    })
    it("returns a finding on SwapEnabledSet event with state 'false'", async () => {
      const txEvent = createTxEvent({
        logs: [logsMatchEventUnpaused],
        addresses: { [poolAddress]: true, [vaultAddress]: true }
      })

      mockContract.getVault.mockReturnValueOnce(vaultAddress)
      const findings = await handleTransaction(txEvent)

      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: "Balancer Pool Swap Enabled Changed",
          description: `Swaps for pool ${poolAddress} are disabled`,
          alertId: "BALANCER-SWAP-ENABLED-CHANGED",
          type: FindingType.Suspicious,
          severity: FindingSeverity.Medium,
          metadata: {
            address: poolAddress,
            swapEnabled: false,
          },
        }),
      ])
    })
  })
})
