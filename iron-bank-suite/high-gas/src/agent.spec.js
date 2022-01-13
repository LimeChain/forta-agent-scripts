const {
  FindingType,
  FindingSeverity,
  Finding,
  createTransactionEvent
} = require("forta-agent")
const { handleTransaction } = require("./agent")
const { markets } = require("./iron-bank-markets")

describe("high-gas agent", () => {

  const createTxEvent = ({ gasUsed, addresses }) =>
    createTransactionEvent({
      receipt: { gasUsed },
      addresses,
    })

  describe("handleTransaction", () => {
    it("returns empty findings if there isn't a high gas usage", async () => {
      const gasUsedDecimal = 100_000
      const gasUsed = `0x${gasUsedDecimal.toString(16)}`
      const txEvent = createTxEvent({
        gasUsed,
        addresses: { [markets['cyWETH']]: true }
      })
      const findings = await handleTransaction(txEvent)

      expect(findings).toStrictEqual([])
    });

    it("returns a finding if there is a high gas usage", async () => {      
      const gasUsedDecimal = 4_000_000
      const gasUsed = `0x${gasUsedDecimal.toString(16)}`
      const txEvent = createTxEvent({
        gasUsed,
        addresses: { [markets['cyWETH']]: true }
      })
      const findings = await handleTransaction(txEvent)

      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: "High gas",
          description: `Gas used is > 3M`,
          alertId: "IRON-BANK-HIGH-GAS",
          protocol: "iron-bank",
          severity: FindingSeverity.Medium,
          type: FindingType.Info,
          metadata: {
            gasUsed: gasUsedDecimal.toString(),
          },
        }),
      ])
    })
  })
})
