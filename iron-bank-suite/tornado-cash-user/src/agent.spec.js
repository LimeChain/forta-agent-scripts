const {
  FindingType,
  FindingSeverity,
  Finding,
  ethers,
  createTransactionEvent
} = require("forta-agent")
const { provideHandleTransaction } = require("./agent")
const { markets } = require("./agent-config")

const account = '0xaccount'
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

  beforeAll(() => {
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
        addresses: {[markets['cyWETH']]: true}
      })
      const findings = await handleTransaction(txEvent)

      expect(findings).toStrictEqual([])
    });

    it("returns a finding if the account has tornado.cash withdraws", async () => {      
      mockResponse.mockReturnValueOnce(responseWithTornadoCashTxs)

      const txEvent = createTxEvent({
        from: account,
        blockNumber: 1000,
        addresses: { [markets['cyWETH']]: true }
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
