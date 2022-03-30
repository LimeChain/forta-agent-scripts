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
const to = "0xto"
const addressZero = ethers.constants.AddressZero

const amount = ethers.utils.parseUnits("100", 18)

const mockMintEvent = {
  address: marketAddress,
  args: {
    from: addressZero,
    to,
    amount
  }
}

const mockRedeemEvent = {
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

describe("best yield token mint or redeem with flash loan", () => {
  const mockTxEvent = { filterLog: jest.fn() }

  const mockDetector = {
    init: () => {},
    getFlashloans: jest.fn()
  }

  const mockInit = () => {}
  const mockGetMarkets = () => markets

  beforeAll(async () => {
    const initialize = provideInitialize(mockInit, mockGetMarkets, mockDetector)
    await initialize()
  })

  beforeEach(() => {
    mockTxEvent.filterLog.mockReset()
    mockDetector.getFlashloans.mockReset()
  })

  describe("handleTransaction", () => {
    it("returns empty findings if there are no mint or redeem events", async () => {
      mockTxEvent.filterLog.mockReturnValueOnce([])
      const findings = await handleTransaction(mockTxEvent)

      expect(findings).toStrictEqual([])
    })

    it("returns a finding if there is a redeem event with Iron Bank flashloan", async () => {
      mockTxEvent.filterLog.mockReturnValueOnce([mockRedeemEvent])
      mockDetector.getFlashloans.mockReturnValueOnce(['Iron Bank'])
      const findings = await handleTransaction(mockTxEvent)

      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: `Best Yield Token Redeem With Flashloan`,
          description: `Redeem of Idle tokens in a transaction with flashloan`,
          alertId: "IDLE-BEST-YIELD-MINT-OR-BORROW-WITH-FLASHLOAN",
          protocol: "idlefi",
          severity: FindingSeverity.Medium,
          type: FindingType.Info,
          metadata: {
            interactions: [{ type: "Redeem", symbol }],
            protocols: [ "Iron Bank" ]
          }
        }),
      ])
    })

    it("returns a finding if there is a mint event with Aave flashloan", async () => {
      mockTxEvent.filterLog.mockReturnValueOnce([mockMintEvent])
      mockDetector.getFlashloans.mockReturnValueOnce(['Aave'])
      const findings = await handleTransaction(mockTxEvent)

      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: `Best Yield Token Mint With Flashloan`,
          description: `Mint of Idle tokens in a transaction with flashloan`,
          alertId: "IDLE-BEST-YIELD-MINT-OR-BORROW-WITH-FLASHLOAN",
          protocol: "idlefi",
          severity: FindingSeverity.Medium,
          type: FindingType.Info,
          metadata: {
            interactions: [{ type: "Mint", symbol }],
            protocols: [ "Aave" ]
          }
        }),
      ])
    })

    it("returns a finding if there is a mint event with dydx, MakerDAO and Euler flashloan", async () => {
      mockTxEvent.filterLog.mockReturnValueOnce([mockMintEvent])
      mockDetector.getFlashloans.mockReturnValueOnce(["dYdX", "Euler", "MakerDAO"])
      const findings = await handleTransaction(mockTxEvent)

      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: `Best Yield Token Mint With Flashloan`,
          description: `Mint of Idle tokens in a transaction with flashloan`,
          alertId: "IDLE-BEST-YIELD-MINT-OR-BORROW-WITH-FLASHLOAN",
          protocol: "idlefi",
          severity: FindingSeverity.Medium,
          type: FindingType.Info,
          metadata: {
            interactions: [{ type: "Mint", symbol }],
            protocols: [ "dYdX", "Euler", "MakerDAO" ]
          }
        }),
      ])
    })
  })
})
