const {
  FindingType,
  FindingSeverity,
  Finding,
} = require("forta-agent")
const { provideInitialize, handleTransaction } = require("./agent")

const hash = "hash"
const action = "Borrow"
const market = "0x41c84c0e2ee0b740cf0d31f63f3b6f627dc6b393"
const account = "0xaccount"

const event = { address: market, name: action, args: [account] }

describe("high-number-of-market-interactions agent", () => {
  const mockTxEvent = {
    block: { timestamp: 100 },
    hash,
    filterLog: jest.fn() 
  }
  const markets = {}
  markets[market] = { 
    name: "cyWETH",
    decimalsUnderlying: 18
  }
  const mockGetMarkets = () => markets

  beforeAll(() => {
    const initialize = provideInitialize(mockGetMarkets)
    initialize()
  })

  beforeEach(() => {
    mockTxEvent.filterLog.mockReset()
  })

  describe("handleTransaction", () => {
    it("returns empty findings if there isn't a high number of interactions", async () => {
      mockTxEvent.filterLog.mockReturnValue([])
      const findings = await handleTransaction(mockTxEvent)

      expect(findings).toStrictEqual([])
    });

    it("returns a finding if there is a high number of interactions", async () => {      
      const events = [...Array(11)].map(() => event)
      const interactions = events.map(() => {
        return { hash, action }
      })

      mockTxEvent.filterLog.mockReturnValueOnce(events)
      const findings = await handleTransaction(mockTxEvent)

      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: "High number of market interactions",
          description: `There were more than 10 interactions ` +
          `with cyWETH market in the last 5 minutes`,
          alertId: "IRON-BANK-HIGH-NUMBER-OF-MARKET-INTERACTIONS",
          protocol: "iron-bank",
          severity: FindingSeverity.Medium,
          type: FindingType.Info,
          metadata: {
            market,
            interactions
          },
        }),
      ])
    })
  })
})
