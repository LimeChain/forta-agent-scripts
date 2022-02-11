const {
  FindingType,
  FindingSeverity,
  Finding,
  ethers
} = require("forta-agent")
const { handleTransaction, provideInitialize } = require("./agent")

const market = "0x41c84c0e2ee0b740cf0d31f63f3b6f627dc6b393"

const mockMintEvent = {
  address: market,
}
const mockAaveEvent = {
  address: "aaveAddress",
}
const mockDydxWithdrawEvent = {
  args: {
    market: ethers.constants.Zero,
    update: {
      deltaWei: {
        sign: false,
        value: ethers.BigNumber.from(10)
      }
    }
  }
}
const mockDydxDepositEvent = {
  args: {
    market: ethers.constants.Zero,
    update: {
      deltaWei: {
        sign: true,
        value: ethers.BigNumber.from(12)
      }
    }
  }
}

describe("mint-or-borrow-with-flashloan agent", () => {
  const mockTxEvent = { filterLog: jest.fn() }

  const markets = {}
  markets[market] = { 
    name: "cyWETH",
    decimalsUnderlying: 18
  }
  const mockGetMarkets = () => markets

  beforeAll(async () => {
    initialize = provideInitialize(mockGetMarkets)
    await initialize()
  })

  beforeEach(() => {
    mockTxEvent.filterLog.mockReset()
  })

  describe("handleTransaction", () => {
    it("returns empty findings if there isn't a mint or borrow in the same tx as flashloan", async () => {
      mockTxEvent.filterLog.mockReturnValueOnce([])
      const findings = await handleTransaction(mockTxEvent)

      expect(findings).toStrictEqual([])
    });

    it("returns a finding if there is a mint or borrow in the same tx as AAVE flashloan", async () => {
      mockTxEvent.filterLog.mockReturnValueOnce([mockMintEvent])
      mockTxEvent.filterLog.mockReturnValueOnce([]) // Iron Bank flashloan check
      mockTxEvent.filterLog.mockReturnValueOnce([mockAaveEvent]) // AAVE flashloan check
      mockTxEvent.filterLog.mockReturnValueOnce([]) // dydx flashloan check
      const findings = await handleTransaction(mockTxEvent)

      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: "Iron Bank interaction and flashloan",
          description: `Iron Bank interaction in the same tx as flashloan`,
          alertId: "IRON-BANK-MARKET-INTERACTION-AND-FLASHLOAN",
          protocol: "iron-bank",
          severity: FindingSeverity.Medium,
          type: FindingType.Info,
        }),
      ])
    })

    it("returns a finding if there is a mint or borrow in the same tx as dydx flashloan", async () => {
      mockTxEvent.filterLog.mockReturnValueOnce([mockMintEvent])
      mockTxEvent.filterLog.mockReturnValueOnce([]) // Iron Bank flashloan check
      mockTxEvent.filterLog.mockReturnValueOnce([]) // AAVE flashloan check
      mockTxEvent.filterLog.mockReturnValueOnce([mockDydxWithdrawEvent, mockDydxDepositEvent]) // dydx flashloan check
      const findings = await handleTransaction(mockTxEvent)

      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: "Iron Bank interaction and flashloan",
          description: `Iron Bank interaction in the same tx as flashloan`,
          alertId: "IRON-BANK-MARKET-INTERACTION-AND-FLASHLOAN",
          protocol: "iron-bank",
          severity: FindingSeverity.Medium,
          type: FindingType.Info,
        }),
      ])
    })
  })
})
