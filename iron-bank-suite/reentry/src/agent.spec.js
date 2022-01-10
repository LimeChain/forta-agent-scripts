const {
  FindingType,
  FindingSeverity,
  Finding,
} = require("forta-agent")
const { handleTransaction } = require("./agent")

// Taken from 0xf58dcd10023fc98d636f4209558f72368fd82c3919d5394e210d417bc50e444c
// 2 seperate borrows; no reentry
const traces = require("./test-data")

// Taken from 0x0016745693d68d734faa408b94cdf2d6c95f511b50f47b03909dc599c1dd9ff6
// CREAM AMP exploit transaction
// Contains nested borrows
// The addresses of the CREAM markets are changed to Iron Bank markets
// because we filter out all other addresses
const tracesExploit = require("./test-data-exploit")

describe("reentry agent", () => {

  describe("handleTransaction", () => {
    it("returns empty findings if there aren't nested borrows", async () => {
      const mockTxEvent = { traces }
      const findings = await handleTransaction(mockTxEvent)

      expect(findings).toStrictEqual([])
    });

    it("returns a finding if there are nested borrows", async () => {
      const mockTxEvent = { traces: tracesExploit }
      const findings = await handleTransaction(mockTxEvent)

      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: "Borrow reentry",
          description: `Nested borrows`,
          alertId: "IRON-BANK-REENTRY",
          protocol: "iron-bank",
          severity: FindingSeverity.Critical,
          type: FindingType.Exploit,
        }),
      ])
    })
  })
})
