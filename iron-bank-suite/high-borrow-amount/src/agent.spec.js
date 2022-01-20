const {
  FindingType,
  FindingSeverity,
  Finding,
  ethers
} = require("forta-agent")
const { provideInitialize, handleTransaction } = require("./agent")
const { markets } = require("./iron-bank-markets")

// const address = "0xab1c342c7bf5ec5f02adea1c2270670bca144cbb"
// const protocol = "0xprotocol"
// const creditLimit = ethers.constants.One

const address = markets["cyWETH"]
const borrower = "0xsomeborrower"

// Set the borrow amount to 1000 and the price of 1 ETH to 5100
// The $ amount is 5_100_000
const borrowAmount = ethers.utils.parseEther("1000")
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
        address,
        args: { borrower, borrowAmount },
      }
      mockTxEvent.filterLog.mockReturnValueOnce([mockMintEvent])
      mockContract.getUnderlyingPrice.mockReturnValueOnce(oraclePrice)
      const findings = await handleTransaction(mockTxEvent)

      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: "Borrow with high amount",
          description: `Address ${borrower} borrowed $5100000.00 from cyWETH`,
          alertId: "IRON-BANK-HIGH-BORROW-AMOUNT",
          protocol: "iron-bank",
          severity: FindingSeverity.Medium,
          type: FindingType.Info,
          metadata: {
            borrower,
            amount: 5100000,
            market: address
          },
        }),
      ])
    })
  })
})
