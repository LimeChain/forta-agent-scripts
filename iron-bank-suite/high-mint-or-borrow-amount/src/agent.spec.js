const {
  FindingType,
  FindingSeverity,
  Finding,
  ethers
} = require("forta-agent")
const { provideInitialize, handleTransaction } = require("./agent")
const { markets } = require("./iron-bank-markets")

const address = markets["cyWETH"]
const account = "0xsomeaccount"

// Set the borrow amount to 1000 and the price of 1 ETH to 5100
// The $ amount is 5_100_000
const amount = ethers.utils.parseEther("1000")
const oraclePrice = ethers.utils.parseEther("5100")

describe("high-borrow-amount agent", () => {
  const mockTxEvent = { filterLog: jest.fn() }
  const mockContract = { getUnderlyingPrice: jest.fn() }
  const mockCreateContract = () => mockContract

  beforeAll(async () => {
    initialize = provideInitialize(mockCreateContract)
    await initialize()
  })

  beforeEach(() => {
    mockTxEvent.filterLog.mockReset()
    mockContract.getUnderlyingPrice.mockReset()
    provideInitialize(mockCreateContract)
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
        address,
        args: [ account, amount ],
      }
      mockTxEvent.filterLog.mockReturnValueOnce([mockMintEvent])
      mockContract.getUnderlyingPrice.mockReturnValueOnce(oraclePrice)
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
            market: address
          },
        }),
      ])
    })

    it("returns a finding if there is a Mint event with high mintAmount", async () => {      
      const mockMintEvent = {
        name: 'Mint',
        address,
        args: [ account, amount ],
      }
      mockTxEvent.filterLog.mockReturnValueOnce([mockMintEvent])
      mockContract.getUnderlyingPrice.mockReturnValueOnce(oraclePrice)
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
            market: address
          },
        }),
      ])
    })
  })
})
