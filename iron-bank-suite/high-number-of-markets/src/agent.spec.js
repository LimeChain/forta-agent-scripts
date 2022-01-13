const {
  FindingType,
  FindingSeverity,
  Finding,
  createTransactionEvent,
  ethers
} = require("forta-agent")
const { handleTransaction } = require("./agent");
const { markets } = require("./iron-bank-markets");

describe("high-number-of-markets agent", () => {

  describe("handleTransaction", () => {
    it("returns empty findings if there is <= 4 markets", async () => {
      const addresses = {[markets["cyWETH"]]: true}
      const txEvent = createTransactionEvent({ addresses })
      const findings = await handleTransaction(txEvent)

      expect(findings).toStrictEqual([])
    });

    it("returns a finding if there is > 4 markets", async () => {    
      // We add 5 Iron Bank markets to the tx addresses  
      const addresses = {
        [markets["cyWETH"]]: true, 
        [markets["cyWBTC"]]: true, 
        [markets["cyUSDT"]]: true, 
        [markets["cyUSDC"]]: true, 
        [markets["cyUNI"]]: true
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
        }),
      ])
    })
  })
})
