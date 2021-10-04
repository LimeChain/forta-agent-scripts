const {
  FindingType,
  FindingSeverity,
  Finding,
  createTransactionEvent,
} = require("forta-agent")

const { provideHandleTransaction } = require("./agent")
const { eventSigs, contractAddress } = require("./agent-config.json")

const borrowEventTopic = '0x13ed6866d4e1ee6da46f845c46d7e54120883d75c5ea9a2dacc1c4ca8984ab80'
const borrowEvent = eventSigs[0]

const logsMatchEvent = [
  {
    address: contractAddress,
    topics: [ borrowEventTopic ],
  }
]
const logsNoMatchEvent = [
  {
    address: contractAddress,
    topics: [ '0x0' ],
  }
]

describe("high volume agent", () => {
  let handleTransaction
  const mockTxCounter = {
    increment: jest.fn(),
    getTransactions: jest.fn(),
    reset: jest.fn()
  }

  const createTxEvent = ({ from, hash, logs, addresses, timestamp }) =>
    createTransactionEvent({
      transaction: { from, hash },
      block: { timestamp },
      receipt: { logs },
      addresses
    })

  beforeAll(() => {
    handleTransaction = provideHandleTransaction(mockTxCounter)
  })

  describe("handleTransaction", () => {
    it("returns empty findings if volume is below threshold", async () => {
      const txEvent = createTxEvent({ 
        from: "0x1", 
        hash: "0xa", 
        timestamp: 100,
        logs: logsNoMatchEvent,
        addresses: { [contractAddress]: true }
      })

      const findings = await handleTransaction(txEvent)

      expect(mockTxCounter.increment).toHaveBeenCalledTimes(0)
      expect(findings).toStrictEqual([])
    })

    it("returns a finding if volume is above threshold", async () => {
      const txEvent = createTxEvent({ 
        from: "0x1", 
        hash: "0xa", 
        timestamp: 100,
        logs: logsMatchEvent,
        addresses: { [contractAddress]: true }
      })

      mockTxCounter.increment.mockReset()
      mockTxCounter.increment.mockReturnValueOnce(5)
      const transactions = [
        { txHash: txEvent.hash, timestamp: txEvent.timestamp },
      ]
      mockTxCounter.getTransactions.mockReturnValueOnce(transactions)

      const findings = await handleTransaction(txEvent)

      expect(mockTxCounter.increment).toHaveBeenCalledTimes(1)
      expect(mockTxCounter.increment).toHaveBeenCalledWith(
        txEvent.from,
        borrowEvent,
        txEvent.hash,
        txEvent.timestamp
      )
      expect(mockTxCounter.getTransactions).toHaveBeenCalledTimes(1)
      expect(mockTxCounter.getTransactions).toHaveBeenCalledWith(txEvent.from, borrowEvent)
      expect(mockTxCounter.reset).toHaveBeenCalledTimes(1)

      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: "High Transaction Activity",
          description: `${txEvent.from} did Borrow 5 times in the last minute`,
          alertId: "cream-v1-eth-activity",
          type: FindingType.Suspicious,
          severity: FindingSeverity.Medium,
          metadata: {
            from: txEvent.from,
            transactions: JSON.stringify(transactions),
          },
        }),
      ])
    })
  })
})
