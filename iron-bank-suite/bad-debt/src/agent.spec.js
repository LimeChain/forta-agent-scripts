const {
  FindingType,
  FindingSeverity,
  Finding,
  ethers,
} = require("forta-agent")
const { handleTransaction, provideInitialize } = require("./agent")
const { markets } = require("./iron-bank-markets")

describe("bad debt agent", () => {
  const mockTxEvent = { filterLog: jest.fn() }
  const mockContract = { getAccountLiquidity: jest.fn() }
  const mockCreateContract = () => mockContract

  const shortfall = ethers.BigNumber.from(100)
  const account = '0xaccount'

  beforeAll(async () => {
    initialize = provideInitialize(mockCreateContract)
    await initialize()
  })

  beforeEach(() => {
    mockTxEvent.filterLog.mockReset()
    mockContract.getAccountLiquidity.mockReset()
  })

  describe("handleTransaction", () => {
    it("returns empty findings if there are not matching events", async () => {
      mockTxEvent.filterLog.mockReturnValue([])
      const findings = await handleTransaction(mockTxEvent);
      expect(findings).toStrictEqual([]);
    });

    it("returns a finding if the account has shortfall", async () => {
      const mockMintEvent = {
        address: markets['cyWETH'],
        args: [ account ],
      }
      mockTxEvent.filterLog.mockReturnValueOnce([mockMintEvent])
      mockTxEvent.filterLog.mockReturnValue([])
      mockContract.getAccountLiquidity.mockReturnValueOnce([
        ethers.constants.Zero,
        ethers.constants.Zero,
        shortfall,
      ])

      const findings = await handleTransaction(mockTxEvent)

      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: "Account has bad debt",
          description: `The account has bad debt after interacting with the Iron Bank`,
          alertId: "IRON-BANK-BAD-DEBT",
          protocol: "iron-bank",
          severity: FindingSeverity.Medium,
          type: FindingType.Degraded,
          metadata: {
            account,
            shortfall: shortfall.toString(),
          },
        }),
      ]);
    });
  });
});
