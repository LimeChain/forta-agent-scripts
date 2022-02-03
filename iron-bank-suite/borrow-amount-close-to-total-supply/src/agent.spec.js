const {
  FindingType,
  FindingSeverity,
  Finding,
  ethers
} = require("forta-agent")
const { provideHandleInitialize, handleTransaction } = require("./agent")

const market = "0x41c84c0e2ee0b740cf0d31f63f3b6f627dc6b393"
const borrower = "0xborrower"

// The user borrows 11 of the underlying asset.
// The tatalSupply of the underlying asset is
// totalSupply * exchangeRateStored = 100
const borrowAmount = ethers.utils.parseEther("11")
const totalSupply = ethers.utils.parseEther("1")
const exchangeRateStored = ethers.utils.parseEther("100")

describe("borrow-amount-close-to-total-supply agent", () => {
  const mockTxEvent = { filterLog: jest.fn() }
  const mockProvider = {
    all: jest.fn(),
  }
  const markets = {
    "0x41c84c0e2ee0b740cf0d31f63f3b6f627dc6b393": { name: "cyWETH", decimalsUnderlying: 18 }
  }

  const mockCreateProvider = () => mockProvider
  const mockGetMarkets = () => markets

  beforeAll(async () => {
    initialize = provideHandleInitialize(mockGetMarkets, mockCreateProvider)
    await initialize()
  })

  beforeEach(() => {
    mockProvider.all.mockReset()
    mockTxEvent.filterLog.mockReset()
  })

  describe("handleTransaction", () => {
    it("returns empty findings if there isn't a borrow with amount close to totalSupply", async () => {
      mockTxEvent.filterLog.mockReturnValue([])
      const findings = await handleTransaction(mockTxEvent)

      expect(findings).toStrictEqual([])
    });

    it("returns a finding if there is a borrow with amount close to totalSupply", async () => {      
      const mockMintEvent = {
        address: market,
        args: { borrower, borrowAmount },
      }
      mockTxEvent.filterLog.mockReturnValueOnce([mockMintEvent])
      // mockContract.totalSupply.mockReturnValueOnce(totalSupply)
      // mockContract.exchangeRateStored.mockReturnValueOnce(exchangeRateStored)
      mockProvider.all.mockReturnValueOnce([totalSupply, exchangeRateStored])

      const findings = await handleTransaction(mockTxEvent)

      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: "Borrow amount close to total supply",
          description: `${borrower} borrowed 11.00 from ` + 
          `cyWETH which is close to the total supply ` + 
          `(100.00) of the market`,
          alertId: "BORROW-AMOUNT-CLOSE-TO-TOTAL-SUPPLY",
          protocol: "iron-bank",
          severity: FindingSeverity.Medium,
          type: FindingType.Info,
          metadata: {
            borrower,
            market,
            borrowAmount: "11.0",
            percentage: "11.00"
          },
        }),
      ])
    })
  })
})
