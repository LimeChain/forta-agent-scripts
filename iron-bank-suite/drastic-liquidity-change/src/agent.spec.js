const {
  FindingType,
  FindingSeverity,
  Finding,
  ethers
} = require("forta-agent")
const { handleTransaction, initialize } = require("./agent")
const { markets } = require("./iron-bank-markets")

const ten = ethers.BigNumber.from(10)
const twenty = ethers.BigNumber.from(20)

const firstLog = {
  address: markets['cyWETH'],
  args: {
    cashPrior: ten,
    totalBorrows: ten
  }
}
const secondLog = {
  address: markets['cyWETH'],
  args: {
    cashPrior: twenty,
    totalBorrows: ten
  }
}

describe("drastic-liquidity-change agent", () => {
  const mockTxEvent = { filterLog: jest.fn() }

  beforeEach(() => {
    mockTxEvent.filterLog.mockReset()
    initialize()
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
            address: markets['cyWETH'],
            percentage: "100.00",
            type: "cashPrior"
          },
        }),
      ])
    })
  })
})
