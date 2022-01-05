const {
  FindingType,
  FindingSeverity,
  Finding,
  ethers
} = require("forta-agent")
const { handleTransaction } = require("./agent")

const address = "0xab1c342c7bf5ec5f02adea1c2270670bca144cbb"
const name = "NewPriceOracle"

describe("system-related-changes agent", () => {
  const mockTxEvent = { filterLog: jest.fn() }

  beforeEach(() => {
    mockTxEvent.filterLog.mockReset()
  })

  describe("handleTransaction", () => {
    it("returns empty findings if there isn't a system related change", async () => {
      mockTxEvent.filterLog.mockReturnValue([])
      const findings = await handleTransaction(mockTxEvent)

      expect(findings).toStrictEqual([])
    });

    it("returns a finding if there is a system related change", async () => {    
      const mockMintEvent = {
        address,
        name
      }
      mockTxEvent.filterLog.mockReturnValueOnce([mockMintEvent])
      const findings = await handleTransaction(mockTxEvent)

      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: "System related change",
          description: `${name} for Comptroller`,
          alertId: "IRON-BANK-SYSTEM-RELATED-CHANGE",
          protocol: "iron-bank",
          severity: FindingSeverity.Medium,
          type: FindingType.Info,
          metadata: {
            address,
            name
          },
        }),
      ])
    })
  })
})
