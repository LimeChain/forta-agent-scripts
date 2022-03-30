const {
  FindingType,
  FindingSeverity,
  Finding,
  ethers
} = require("forta-agent")
const { handleBlock, provideInitialize } = require("./agent")

const oldValue = 10_000
const value = 30_000
const tokenSymbol = "idleDAIYield"

describe("perpetual yield tranches large change in contract value agent", () => {
  const mockBlockEvent = {
    blockNumber: 100,
  }

  const cdos = [
    {
      tokenSymbol,
      tokenDecimals: 18,
      oldContractValue: oldValue
    }
  ]
  const mockGetCdos = () => cdos

  const mockGetValues = jest.fn()

  beforeAll(async () => {
    const initialize = provideInitialize(mockGetCdos, mockGetValues)
    await initialize()
  })

  beforeEach(() => {
    mockGetValues.mockReset()
  })

  describe("handleBlock", () => {
    it("returns empty findings if the value difference is small", async () => {
      mockGetValues.mockReturnValueOnce([oldValue])
      const findings = await handleBlock(mockBlockEvent)

      expect(findings).toStrictEqual([])
    });

    it("returns a finding if the value difference is drastic", async () => {
      mockGetValues.mockReturnValueOnce([value])
      const findings = await handleBlock(mockBlockEvent)

      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: "Perpetual Yield Tranches Large Change in Contract Value",
          description: `The contractValue of the ${tokenSymbol} CDO has changed by ${value-oldValue} USD`,
          alertId: "IDLE-PERPETUAL-YIELD-TRANCHES-DRASTIC-CHANGE-IN-CONTRACT-VALUE",
          protocol: "idlefi",
          severity: FindingSeverity.Medium,
          type: FindingType.Info,
          metadata: {
            oldValue: 10_000,
            value: 30_000,
            cdo: tokenSymbol,
          }
        }),
      ])
    })
  })
})
