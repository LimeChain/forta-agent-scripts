const {
  FindingType,
  FindingSeverity,
  Finding,
  ethers
} = require("forta-agent")
const { handleTransaction, provideInitialize } = require("./agent")

const symbol = "idleDAIYield"
const marketAddress = "0xmarket"
const from = "0xfrom"
const addressZero = ethers.constants.AddressZero

// 1 underlying = $50
// 1 idleToken = 10 underlyng = $500
// amount = 100 idleTokens = $50000
const priceUSD = ethers.utils.parseUnits("50", 18)
const tokenPrice = ethers.utils.parseUnits("10", 18)
const amount = ethers.utils.parseUnits("100", 18)

// If the price is 1 the amount will be $1000
const lowPriceUSD = ethers.utils.parseUnits("1", 18)

describe("best yield token mint or redeem with high amount agent", () => {
  const mockTxEvent = { filterLog: jest.fn() }

  const log = {
    address: marketAddress,
    args: {
      from,
      to: addressZero,
      amount
    }
  }

  const markets = {}
  markets[marketAddress] = {
    symbol,
    decimals: 18,
    contract: { tokenPrice: () => {} }
  }
  const mockGetMarkets = () => markets

  const oracle = { getPriceUSD: jest.fn() }
  const mockGetOracle = () => oracle

  const provider = { all: jest.fn() }
  const mockGetProvider = () => provider

  beforeAll(async () => {
    const initialize = provideInitialize(mockGetMarkets, mockGetOracle, mockGetProvider)
    await initialize()
  })

  beforeEach(() => {
    mockTxEvent.filterLog.mockReset()
    provider.all.mockReset()
  })

  describe("handleTransaction", () => {
    it("returns empty findings if the USD amount is less than the threshold", async () => {
      mockTxEvent.filterLog.mockReturnValueOnce([log])
      provider.all.mockReturnValueOnce([lowPriceUSD, tokenPrice])
      const findings = await handleTransaction(mockTxEvent)

      expect(findings).toStrictEqual([])
    });

    it("returns a finding if the USD amount is more than the threshold", async () => {
      mockTxEvent.filterLog.mockReturnValueOnce([log])
      provider.all.mockReturnValueOnce([priceUSD, tokenPrice])
      const findings = await handleTransaction(mockTxEvent)

      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: `Best Yield Token Redeem With High Amount`,
          description: `Redeem of ${symbol} tokens with high amount`,
          alertId: "IDLE-BEST-YIELD-MINT-OR-BORROW-WITH-HIGH-AMOUNT",
          protocol: "idlefi",
          severity: FindingSeverity.Medium,
          type: FindingType.Info,
          metadata: {
            type: "Redeem",
            usdAmount: 50_000.0
          }
        }),
      ])
    })
  })
})
