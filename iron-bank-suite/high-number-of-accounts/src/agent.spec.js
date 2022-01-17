const {
  FindingType,
  FindingSeverity,
  Finding,
  ethers,
  createTransactionEvent
} = require("forta-agent")
const { provideHandleTransaction } = require("./agent")

const zero = ethers.constants.Zero
const one = ethers.constants.One

const addresses = {}
const mockData = []

// Add 51 addresses to the txEvent
// and 51 accounts with liquidity to the mockData
for (let i = 0; i < 51; i++) {
  addresses[`0xaddr${i}`] = true
  mockData.push([zero, one, zero])
}

describe("high-number-of-accounts agent", () => {
  let handleTransaction
  const mockEthcallProvider = { all: jest.fn() }
  const mockContract = { getAccountLiquidity: () => "unused" }

  const createTxEvent = ({ addresses }) =>
    createTransactionEvent({
      addresses,
    })

  beforeEach(() => {
    mockEthcallProvider.all.mockReset()
  })

  beforeAll(() => {
    handleTransaction = provideHandleTransaction(mockEthcallProvider, mockContract)
  })

  describe("handleTransaction", () => {
    it("returns empty findings if there aren't > 50 accounts", async () => {
      const txEvent = createTxEvent({
        addresses: { ["0xaddr0"]: true },
      })

      mockEthcallProvider.all.mockReturnValue([])
      const findings = await handleTransaction(txEvent)

      expect(findings).toStrictEqual([])
    });

    it("returns a finding if there are > 50 accounts", async () => {      
      const txEvent = createTxEvent({
        addresses,
      })

      mockEthcallProvider.all.mockReturnValue(mockData)
      const findings = await handleTransaction(txEvent)

      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: "High number of accounts",
          description: `In the transaction are involved more than 50 accounts`,
          alertId: "IRON-BANK-HIGH-NUMBER-OF-ACCOUNTS",
          protocol: "iron-bank",
          severity: FindingSeverity.Medium,
          type: FindingType.Suspicious,
        }),
      ])
    })
  })
})
