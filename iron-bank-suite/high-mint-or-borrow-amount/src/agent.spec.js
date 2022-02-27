const {
  FindingType,
  FindingSeverity,
  Finding,
  ethers
} = require("forta-agent")
const { provideInitialize, handleTransaction } = require("./agent")

const market = "0x41c84c0e2ee0b740cf0d31f63f3b6f627dc6b393"
const account = "0xsomeaccount"

// Set the borrow amount to 1000 and the price of 1 ETH to 5100
// The $ amount is 5_100_000
const amount = ethers.utils.parseEther("1000")
const oraclePrice = ethers.utils.parseEther("5100")

describe("high-borrow-amount agent", () => {
  const mockTxEvent = { filterLog: jest.fn() }

  const markets = {}
  markets[market] = { 
    name: "cyWETH",
    decimalsUnderlying: 18
  }
  const mockGetMarkets = () => markets

  const mockOracle = "0xoracle"
  const mockGetOracle = () => mockOracle

  const mockProvider = { all: jest.fn() }
  const mockGetProvider = () => mockProvider

  beforeAll(async () => {
    initialize = provideInitialize(mockGetMarkets, mockGetOracle, mockGetProvider)
    await initialize()
  })

  beforeEach(() => {
    mockTxEvent.filterLog.mockReset()
    mockProvider.all.mockReset()
  })

  describe("handleTransaction", () => {
    it("returns empty findings if there isn't a Borrow event with high borrowAmount", async () => {
      mockTxEvent.filterLog.mockReturnValue([])
      const findings = await handleTransaction(mockTxEvent)

      expect(findings).toStrictEqual([])
    });

    it("returns a finding if there is a Borrow event with high borrowAmount", async () => {      
      const mockMintEvent = {
        name: 'Borrow',
        address: market,
        args: [ account, amount ],
      }
      mockTxEvent.filterLog.mockReturnValueOnce([mockMintEvent])
      mockProvider.all.mockReturnValueOnce([oraclePrice])
      const findings = await handleTransaction(mockTxEvent)

      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: "Borrow with high amount",
          description: `Address ${account} borrowed $5100000.00 from cyWETH`,
          alertId: "IRON-BANK-HIGH-BORROW-AMOUNT",
          protocol: "iron-bank",
          severity: FindingSeverity.Medium,
          type: FindingType.Info,
          metadata: {
            account,
            amount: 5100000,
            market
          },
        }),
      ])
    })

    it("returns a finding if there is a Mint event with high mintAmount", async () => {      
      const mockMintEvent = {
        name: 'Mint',
        address: market,
        args: [ account, amount ],
      }
      mockTxEvent.filterLog.mockReturnValueOnce([mockMintEvent])
      mockProvider.all.mockReturnValueOnce([oraclePrice])
      const findings = await handleTransaction(mockTxEvent)

      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: "Mint with high amount",
          description: `Address ${account} minted $5100000.00 from cyWETH`,
          alertId: "IRON-BANK-HIGH-MINT-AMOUNT",
          protocol: "iron-bank",
          severity: FindingSeverity.Medium,
          type: FindingType.Info,
          metadata: {
            account,
            amount: 5100000,
            market
          },
        }),
      ])
    })
  })
})
