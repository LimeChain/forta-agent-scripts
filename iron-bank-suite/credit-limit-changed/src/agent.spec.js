const {
  FindingType,
  FindingSeverity,
  Finding,
  ethers
} = require("forta-agent")
const { handleTransaction } = require("./agent")

const address = "0xab1c342c7bf5ec5f02adea1c2270670bca144cbb"
const protocol = "0xprotocol"
const market = "0xmarket"
const creditLimit = ethers.constants.One

describe("credit-limit-changed agent", () => {
  const mockTxEvent = { filterLog: jest.fn() }

  beforeEach(() => {
    mockTxEvent.filterLog.mockReset()
  })

  describe("handleTransaction", () => {
    it("returns empty findings if there isn't a CreditLimitChanged event", async () => {
      mockTxEvent.filterLog.mockReturnValue([])
      const findings = await handleTransaction(mockTxEvent)

      expect(findings).toStrictEqual([])
    });

    it("returns a finding if there is a CreditLimitChanged event", async () => {      
      const mockMintEvent = {
        address,
        args: { protocol, market, creditLimit },
      }
      mockTxEvent.filterLog.mockReturnValueOnce([mockMintEvent])
      const findings = await handleTransaction(mockTxEvent)

      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: "Credit limit changed",
          description: `Credit limit for protocol ${protocol} for market ${market} has changed`,
          alertId: "IRON-BANK-CREDIT-LIMIT-CHANGED",
          protocol: "iron-bank",
          severity: FindingSeverity.Medium,
          type: FindingType.Info,
          metadata: {
            protocol,
            market,
            creditLimit: creditLimit.toString()
          },
        }),
      ])
    })
  })
})
