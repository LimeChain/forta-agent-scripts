const {
  FindingType,
  FindingSeverity,
  Finding,
  ethers,
} = require("forta-agent")
const { handleTransaction, provideInitialize } = require("./agent")

const market = "0x41c84c0e2ee0b740cf0d31f63f3b6f627dc6b393"

describe("bad debt agent", () => {
  const markets = {}
  markets[market] = { 
    name: "cyWETH",
    decimalsUnderlying: 18
  }
  const mockGetMarkets = () => markets
  
  const mockProvider = { all: jest.fn() }
  const mockCreateProvider = () => mockProvider

  const mockTxEvent = { filterLog: jest.fn() }

  const shortfall = ethers.BigNumber.from(100)
  const account = '0xaccount'

  beforeAll(async () => {
    initialize = provideInitialize(mockGetMarkets, mockCreateProvider)
    await initialize()
  })

  beforeEach(() => {
    mockTxEvent.filterLog.mockReset()
    mockProvider.all.mockReset()
  })

  describe("handleTransaction", () => {
    it("returns empty findings if there are not matching events", async () => {
      mockTxEvent.filterLog.mockReturnValue([])
      const findings = await handleTransaction(mockTxEvent);
      expect(findings).toStrictEqual([]);
    });

    it("returns a finding if the account has shortfall", async () => {
      const mockMintEvent = {
        address: market,
        args: [ account ],
      }
      mockTxEvent.filterLog.mockReturnValueOnce([mockMintEvent])
      mockProvider.all.mockReturnValueOnce([[
        ethers.constants.Zero,
        ethers.constants.Zero,
        shortfall,
      ]])

      const findings = await handleTransaction(mockTxEvent)

      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: "Account has bad debt",
          description: `Account has bad debt after interacting with the Iron Bank`,
          alertId: "IRON-BANK-BAD-DEBT",
          protocol: "iron-bank",
          severity: FindingSeverity.Medium,
          type: FindingType.Info,
          metadata: {
            account,
            shortfall: shortfall.toString(),
          },
        }),
      ]);
    });
  });
});
