const {
  FindingType,
  FindingSeverity,
  Finding,
  ethers
} = require("forta-agent")
const { provideInitialize, handleBlock } = require("./agent")

const market = "0x41c84c0e2ee0b740cf0d31f63f3b6f627dc6b393"

// Create 2 cash liquidities; the difference is 100%
const cash1 = ethers.utils.parseEther("100")
const cash2 = ethers.utils.parseEther("200")

const totalBorrows = ethers.utils.parseEther("100")

const mockBlockEvent1 = {
  blockNumber: 10,
  block: {
    timestamp: 100
  },
}

const mockBlockEvent2 = {
  blockNumber: 20,
  block: {
    // Set the block timestamp to almost 10 minutes after the first
    timestamp: 100 + (60 * 10) - 10
  },
}

describe("drastic-price-change agent", () => {
  const markets = {}
  markets[market] = { 
    name: "cyWETH",
    decimalsUnderlying: 18
  }
  const mockGetMarkets = () => markets
  
  const mockProvider = { all: jest.fn() }
  const mockCreateProvider = () => mockProvider

  beforeAll(async () => {
    const initialize = provideInitialize(mockGetMarkets, mockCreateProvider)
    await initialize()
  })

  beforeEach(() => {
    mockProvider.all.mockReset()
  })

  describe("handleTransaction", () => {
    it("returns empty findings if there isn't a drastic liquidity change", async () => {
      mockProvider.all.mockReturnValueOnce([cash1, totalBorrows])
      const findings = await handleBlock(mockBlockEvent1)

      expect(findings).toStrictEqual([])
    });

    it("returns a finding if there is a drastic liquidity change", async () => {

      mockProvider.all.mockReturnValueOnce([cash1, totalBorrows])
      mockProvider.all.mockReturnValueOnce([cash2, totalBorrows])

      await handleBlock(mockBlockEvent1)
      const findings = await handleBlock(mockBlockEvent2)

      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: "Drastic liquidity change for time period",
          description: `Market cyWETH had a 100.00% change in cash for the last 10 minutes`,
          alertId: "IRON-BANK-DRASTIC-LIQUIDITY-CHANGE-FOR-TIME-PERIOD",
          protocol: "iron-bank",
          severity: FindingSeverity.Medium,
          type: FindingType.Info,
          metadata: {
            market: "cyWETH",
            percentage: "100.00",
            type: "cash"
          },
        }),
      ])
    })
  })
})
