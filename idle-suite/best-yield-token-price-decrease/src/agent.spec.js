const {
  FindingType,
  FindingSeverity,
  Finding,
  ethers
} = require("forta-agent")
const { handleBlock, provideInitialize } = require("./agent")

const oldPrice = ethers.utils.parseUnits("100", 18)
const price = ethers.utils.parseUnits("99", 18)
const symbol = "idleDAIYield"

describe("best yield token price decrease agent", () => {
  const mockBlockEvent = {
    blockNumber: 100,
  }

  const markets = [
    {
      symbol,
      decimals: 18,
      oldPrice
    }
  ]
  const mockGetMarkets = () => markets

  const mockGetPrices = jest.fn()

  beforeAll(async () => {
    const initialize = provideInitialize(mockGetMarkets, mockGetPrices)
    await initialize()
  })

  beforeEach(() => {
    mockGetPrices.mockReset()
  })

  describe("handleBlock", () => {
    it("returns empty findings if the price has not decreased", async () => {
      mockGetPrices.mockReturnValueOnce([oldPrice])
      const findings = await handleBlock(mockBlockEvent)

      expect(findings).toStrictEqual([])
    });

    it("returns a finding if the price has decreased", async () => {
      mockGetPrices.mockReturnValueOnce([price])
      const findings = await handleBlock(mockBlockEvent)

      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: "Best Yield Token Price Decrease",
          description: `The token price of ${symbol} has decreased`,
          alertId: "IDLE-BEST-YIELD-TOKEN-PRICE-DECREASE",
          protocol: "idlefi",
          severity: FindingSeverity.Medium,
          type: FindingType.Info,
          metadata: {
            oldPrice: "100.0",
            price: "99.0"
          }
        }),
      ])
    })
  })
})
