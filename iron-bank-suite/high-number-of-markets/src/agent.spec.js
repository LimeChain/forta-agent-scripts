const {
  FindingType,
  FindingSeverity,
  Finding,
  createTransactionEvent,
} = require("forta-agent")
const { handleTransaction, provideInitialize } = require("./agent")

describe("high-number-of-markets agent", () => {
  const markets = {}
  markets["0xmarket0"] = { name: "cyWETH", decimalsUnderlying: 18 }
  markets["0xmarket1"] = { name: "cyWBTC", decimalsUnderlying: 18 }
  markets["0xmarket2"] = { name: "cyUSDT", decimalsUnderlying: 18 }
  markets["0xmarket3"] = { name: "cyUSDC", decimalsUnderlying: 18 }
  markets["0xmarket4"] = { name: "cyUNI", decimalsUnderlying: 18 }
  const mockGetMarkets = () => markets

  beforeAll(async () => {
    initialize = provideInitialize(mockGetMarkets)
    await initialize()
  })

  describe("handleTransaction", () => {
    it("returns empty findings if there is <= 4 markets", async () => {
      const addresses = {["0xmarket0"]: true}
      const txEvent = createTransactionEvent({ addresses })
      const findings = await handleTransaction(txEvent)

      expect(findings).toStrictEqual([])
    });

    it("returns a finding if there is > 4 markets", async () => {    
      // We add 5 Iron Bank markets to the tx addresses  
      const addresses = {
        ["0xmarket0"]: true, 
        ["0xmarket1"]: true, 
        ["0xmarket2"]: true, 
        ["0xmarket3"]: true, 
        ["0xmarket4"]: true
    }
      const txEvent = createTransactionEvent({ addresses })
      const findings = await handleTransaction(txEvent)

      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: "High number of Iron Bank markets",
          description: `The transaction interacted with more than 4 Iron Bank markets`,
          alertId: "IRON-BANK-HIGH-NUMBER-OF-MARKETS",
          protocol: "iron-bank",
          severity: FindingSeverity.Medium,
          type: FindingType.Suspicious,
          metadata: {
            markets: Object.keys(addresses)
          }
        }),
      ])
    })
  })
})
