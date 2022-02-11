const {
  FindingType,
  FindingSeverity,
  Finding,
  ethers,
  createTransactionEvent
} = require("forta-agent")
const { provideHandleTransaction, provideInitialize } = require("./agent")

const account = '0xaccount'
const market = "0x41c84c0e2ee0b740cf0d31f63f3b6f627dc6b393"
let handleTransaction
const mockResponse = jest.fn()

responseWithNoTornadoCashTxs = {
  data: {
    result: [
      { from: '0xasdasd', hash: 'txId' }
    ]
  }
}

responseWithTornadoCashTxs = {
  data: {
    result: [
      { from: '0x12D66f87A04A9E220743712cE6d9bB1B5616B8Fc', hash: 'txId' }
    ]
  }
}

describe("tornado cash user agent", () => {
  const createTxEvent = ({ from, blockNumber, addresses }) => {
    return createTransactionEvent({
      addresses,
      transaction: { from },
      block: { number: blockNumber }
    })
  }

  const markets = {}
  markets[market] = { name: "cyWETH", decimalsUnderlying: 18 }
  const mockGetMarkets = () => markets

  beforeAll(async () => {
    initialize = provideInitialize(mockGetMarkets)
    await initialize()
    handleTransaction = provideHandleTransaction(mockResponse)
  })

  beforeEach(() => {
    mockResponse.mockReset()
  })

  describe("handleTransaction", () => {
    it("returns empty findings if the account has no tornado.cash withdraws", async () => {
      mockResponse.mockReturnValueOnce(responseWithNoTornadoCashTxs)

      const txEvent = createTxEvent({
        from: account,
        blockNumber: 1000,
        addresses: {[market]: true}
      })
      const findings = await handleTransaction(txEvent)

      expect(findings).toStrictEqual([])
    });

    it("returns a finding if the account has tornado.cash withdraws", async () => {      
      mockResponse.mockReturnValueOnce(responseWithTornadoCashTxs)

      const txEvent = createTxEvent({
        from: account,
        blockNumber: 1000,
        addresses: { [market]: true }
      })
      const findings = await handleTransaction(txEvent)

      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: "Account has used Tornado.cash",
          description: `Account has withdrawn from Tornado.cash pool`,
          alertId: "IRON-BANK-TORNADO-CASH-USER",
          protocol: "iron-bank",
          severity: FindingSeverity.Medium,
          type: FindingType.Suspicious,
          metadata: {
            account,
            tornadoCashTxIds: ['txId']
          },
        }),
      ])
    })
  })
})
