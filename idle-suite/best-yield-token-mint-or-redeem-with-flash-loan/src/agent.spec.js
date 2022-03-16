const {
  FindingType,
  FindingSeverity,
  Finding,
  ethers
} = require("forta-agent")
const { handleTransaction, provideInitialize, setMarkets } = require("./agent")

const symbol = "idleDAIYield"
const marketAddress = "0xmarket"
const from = "0xfrom"
const to = "0xto"
const addressZero = ethers.constants.AddressZero

const amount = ethers.utils.parseUnits("100", 18)

const mockMintEvent = {
  address: marketAddress,
  args: {
    from: addressZero,
    to,
    amount
  }
}

const mockRedeemEvent = {
  address: marketAddress,
  args: {
    from,
    to: addressZero,
    amount
  }
}

const markets = {}
markets[marketAddress] = {
  symbol,
  decimals: 18,
  contract: { tokenPrice: () => {} }
}

const mockIronBankEvent = {
  address: "ironBankEvent",
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
const mockMakerEvent = {
  address: "maker",
}

describe("best yield token price decrease agent", () => {
  const mockTxEvent = { filterLog: jest.fn() }

  const mockInit = () => { setMarkets(markets) }

  beforeAll(async () => {
    const initialize = provideInitialize(mockInit)
    await initialize()
  })

  beforeEach(() => {
    mockTxEvent.filterLog.mockReset()
  })

  describe("handleTransaction", () => {
    it("returns empty findings if there are no mint or redeem events", async () => {
      mockTxEvent.filterLog.mockReturnValueOnce([])
      const findings = await handleTransaction(mockTxEvent)

      expect(findings).toStrictEqual([])
    })

    it("returns a finding if there is a redeem event with Iron Bank flashloan", async () => {
      mockTxEvent.filterLog.mockReturnValueOnce([mockRedeemEvent])
      mockTxEvent.filterLog.mockReturnValueOnce([mockIronBankEvent]) // Iron Bank flashloan check
      mockTxEvent.filterLog.mockReturnValueOnce([]) // AAVE flashloan check
      mockTxEvent.filterLog.mockReturnValueOnce([]) // dydx flashloan check
      mockTxEvent.filterLog.mockReturnValueOnce([]) // Maker flashloan check
      const findings = await handleTransaction(mockTxEvent)

      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: `Best Yield Token Redeem With Flashloan`,
          description: `Redeem of Idle tokens in a transaction with flashloan`,
          alertId: "IDLE-BEST-YIELD-MINT-OR-BORROW-WITH-FLASHLOAN",
          protocol: "idlefi",
          severity: FindingSeverity.Medium,
          type: FindingType.Info,
          metadata: {
            interactions: [{ type: "Redeem", symbol }],
            protocols: [ "Iron Bank" ]
          }
        }),
      ])
    })

    it("returns a finding if there is a mint event with Aave flashloan", async () => {
      mockTxEvent.filterLog.mockReturnValueOnce([mockMintEvent])
      mockTxEvent.filterLog.mockReturnValueOnce([]) // Iron Bank flashloan check
      mockTxEvent.filterLog.mockReturnValueOnce([mockAaveEvent]) // AAVE flashloan check
      mockTxEvent.filterLog.mockReturnValueOnce([]) // dydx flashloan check
      mockTxEvent.filterLog.mockReturnValueOnce([]) // Maker flashloan check
      const findings = await handleTransaction(mockTxEvent)

      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: `Best Yield Token Mint With Flashloan`,
          description: `Mint of Idle tokens in a transaction with flashloan`,
          alertId: "IDLE-BEST-YIELD-MINT-OR-BORROW-WITH-FLASHLOAN",
          protocol: "idlefi",
          severity: FindingSeverity.Medium,
          type: FindingType.Info,
          metadata: {
            interactions: [{ type: "Mint", symbol }],
            protocols: [ "Aave" ]
          }
        }),
      ])
    })

    it("returns a finding if there is a mint event with dydx and MakerDAO flashloan", async () => {
      mockTxEvent.filterLog.mockReturnValueOnce([mockMintEvent])
      mockTxEvent.filterLog.mockReturnValueOnce([]) // Iron Bank flashloan check
      mockTxEvent.filterLog.mockReturnValueOnce([]) // AAVE flashloan check
      mockTxEvent.filterLog.mockReturnValueOnce([mockDydxWithdrawEvent, mockDydxDepositEvent]) // dydx flashloan check
      mockTxEvent.filterLog.mockReturnValueOnce([mockMakerEvent]) // Maker flashloan check
      const findings = await handleTransaction(mockTxEvent)

      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: `Best Yield Token Mint With Flashloan`,
          description: `Mint of Idle tokens in a transaction with flashloan`,
          alertId: "IDLE-BEST-YIELD-MINT-OR-BORROW-WITH-FLASHLOAN",
          protocol: "idlefi",
          severity: FindingSeverity.Medium,
          type: FindingType.Info,
          metadata: {
            interactions: [{ type: "Mint", symbol }],
            protocols: [ "dYdX", "MakerDAO" ]
          }
        }),
      ])
    })
  })
})
