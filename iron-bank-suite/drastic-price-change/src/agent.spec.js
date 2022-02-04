const {
  FindingType,
  FindingSeverity,
  Finding,
  ethers
} = require("forta-agent")
const { provideInitialize, handleBlock } = require("./agent")

const market = "0x41c84c0e2ee0b740cf0d31f63f3b6f627dc6b393"

// Create 2 prices; the difference is 100%
const oraclePrice1 = ethers.utils.parseEther("100")
const oraclePrice2 = ethers.utils.parseEther("200")

const mockBlockEvent1 = {
  blockNumber: 10,
  block: {
    timestamp: 100
  },
}

const mockBlockEvent2 = {
  blockNumber: 20,
  block: {
    // Set the block timestamp to almost 1 hour after the first
    timestamp: 100 + (60 * 60) - 10
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

  beforeAll(() => {
    const initialize = provideInitialize(mockGetMarkets, mockCreateProvider)
    initialize()
  })

  beforeEach(() => {
    mockProvider.all.mockReset()
  })

  describe("handleTransaction", () => {
    it("returns empty findings if there isn't a drastic price change", async () => {
      mockProvider.all.mockReturnValueOnce([oraclePrice1])
      const findings = await handleBlock(mockBlockEvent1)

      expect(findings).toStrictEqual([])
    });

    it("returns a finding if there is a drastic price change", async () => {

      mockProvider.all.mockReturnValueOnce([oraclePrice1])
      mockProvider.all.mockReturnValueOnce([oraclePrice2])


      await handleBlock(mockBlockEvent1)
      const findings = await handleBlock(mockBlockEvent2)

      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: "Drastic price change",
          description: `Price for cyWETH changed with 100.00% for the last 60 minutes`,
          alertId: "IRON-BANK-DRASTIC-PRICE-CHANGE",
          protocol: "iron-bank",
          severity: FindingSeverity.Medium,
          type: FindingType.Info,
          metadata: {
            market: "cyWETH",
            percentage: "100.00"
          },
        }),
      ])
    })
  })
})
