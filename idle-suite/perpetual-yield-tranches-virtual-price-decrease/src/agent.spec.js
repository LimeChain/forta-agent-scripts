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

describe("perpetual yield tranches virtual price decrease agent", () => {
  const mockBlockEvent = {
    blockNumber: 100,
  }

  const cdos = [
    {
      tokenSymbol,
      AATrancheToken: { oldPrice },
      BBTrancheToken: { oldPrice },
      decimals: 18,
    }
  ]
  const mockGetCdos = () => cdos

  const mockGetPrices = jest.fn()

  beforeAll(async () => {
    const initialize = provideInitialize(mockGetCdos, mockGetPrices)
    await initialize()
  })

  beforeEach(() => {
    mockGetPrices.mockReset()
  })

  describe("handleBlock", () => {
    it("returns empty findings if the price has not decreased", async () => {
      mockGetPrices.mockReturnValueOnce([oldPrice, oldPrice])
      const findings = await handleBlock(mockBlockEvent)

      expect(findings).toStrictEqual([])
    });

    it("returns a finding if the price has decreased", async () => {
      // Return the same price for the AA tranch but decreased price for the BB tranch
      mockGetPrices.mockReturnValueOnce([oldPrice, price])
      const findings = await handleBlock(mockBlockEvent)

      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: "Perpetual Yield Tranches Virtual Price Decrease",
          description: `The BB virtual price of the ${tokenSymbol} CDO has decreased`,
          alertId: "IDLE-PERPETUAL-YIELD-TRANCHES-VIRTUAL-PRICE-DECREASE",
          protocol: "idlefi",
          severity: FindingSeverity.Critical,
          type: FindingType.Suspicious,
          metadata: {
            oldPrice: "100.0",
            price: "99.0",
            trancheType: "BB",
            symbol: tokenSymbol
          }
        }),
      ])
    })
  })
})
