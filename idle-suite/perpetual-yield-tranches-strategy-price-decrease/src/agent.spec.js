const {
  FindingType,
  FindingSeverity,
  Finding,
  ethers
} = require("forta-agent")
const { handleBlock, provideInitialize } = require("./agent")

const oldPrice = ethers.utils.parseUnits("100", 18)
const price = ethers.utils.parseUnits("99", 18)
const tokenSymbol = "idleDAIYield"

describe("perpetual yield tranches strategy price decrease agent", () => {
  const mockBlockEvent = {
    blockNumber: 100,
  }

  const strategies = [
    {
      oldPrice,
      tokenSymbol,
      tokenDecimals: 18,
    }
  ]
  const mockGetStrategies = () => strategies

  const mockGetPrices = jest.fn()

  beforeAll(async () => {
    const initialize = provideInitialize(mockGetStrategies, mockGetPrices)
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
          name: "Perpetual Yield Tranches Strategy Price Decrease",
          description: `The price of the ${tokenSymbol} strategy has decreased`,
          alertId: "IDLE-PERPETUAL-YIELD-TRANCHES-STRATEGY-PRICE-DECREASE",
          protocol: "idlefi",
          severity: FindingSeverity.Critical,
          type: FindingType.Suspicious,
          metadata: {
            oldPrice: "100.0",
            price: "99.0",
            symbol: tokenSymbol
          }
        }),
      ])
    })
  })
})
