const {
  FindingType,
  FindingSeverity,
  Finding,
  ethers
} = require("forta-agent")
const { handleTransaction, provideHandleInitialize } = require("./agent")

const ten = ethers.BigNumber.from(10)
const twenty = ethers.BigNumber.from(20)

const market = "0x41c84c0e2ee0b740cf0d31f63f3b6f627dc6b393"

const firstLog = {
  address: market,
  args: {
    cashPrior: ten,
    totalBorrows: ten
  }
}
const secondLog = {
  address: market,
  args: {
    cashPrior: twenty,
    totalBorrows: ten
  }
}

describe("drastic-liquidity-change agent", () => {
  const mockTxEvent = { filterLog: jest.fn() }

  const markets = {}
  markets[market] = {
    name: "cyWETH",
    decimalsUnderlying: 18
  }
  
  const mockGetMarkets = () => markets

  beforeAll(async () => {
    initialize = provideHandleInitialize(mockGetMarkets)
    await initialize()
  })

  beforeEach(() => {
    mockTxEvent.filterLog.mockReset()
  })

  describe("handleTransaction", () => {
    it("returns empty findings if there isn't a drastic change in liquidity", async () => {
      mockTxEvent.filterLog.mockReturnValue([firstLog])
      const findings = await handleTransaction(mockTxEvent)

      expect(findings).toStrictEqual([])
    });

    it("returns a finding if there is a drastic change in liquidity", async () => {      
      mockTxEvent.filterLog.mockReturnValueOnce([firstLog])
      mockTxEvent.filterLog.mockReturnValueOnce([secondLog])

      // We handle 2 transactions.
      // After the first one the cashPrior and the totalBorrows are 10
      // In the second tx the cashPrior is 20 => 100% increase
      await handleTransaction(mockTxEvent)
      const findings = await handleTransaction(mockTxEvent)

      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: "Drastic liquidity change",
          description: `cashPrior for cyWETH has drastically changed`,
          alertId: "IRON-BANK-DRASTIC-LIQUIDITY-CHANGE",
          protocol: "iron-bank",
          severity: FindingSeverity.Medium,
          type: FindingType.Suspicious,
          metadata: {
            address: market,
            percentage: "100.00",
            type: "cashPrior"
          },
        }),
      ])
    })
  })
})
