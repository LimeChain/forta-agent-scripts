const {
  FindingType,
  FindingSeverity,
  Finding,
  ethers
} = require("forta-agent")
const { handleTransaction } = require("./agent")

const { markets } = require("./iron-bank-markets")

const mockMintEvent = {
  address: markets["cyWETH"],
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
