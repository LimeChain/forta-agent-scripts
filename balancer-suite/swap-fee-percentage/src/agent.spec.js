const {
  FindingType,
  FindingSeverity,
  Finding,
  createTransactionEvent,
} = require("forta-agent")
const { ethers } = require("ethers")

const { provideHandleTransaction } = require("./agent")

const vaultAddress = "0xBA12222222228d8Ba445958a75a0704d566BF2C8"
const poolAddress = "0x1111"
const poolName = "Balancer 50 WETH 50 USDT"
const eventTopic = "0xa9ba3ffe0b6c366b81232caab38605a0699ad5398d6cce76f91ee809e322dafc"

// 1e18 corresponds to 1.0 or 100% fee
// we use 16 decimals to get the fee in percentages
const fee = ethers.utils.parseUnits("0.33", 16)

const data = ethers.utils.defaultAbiCoder.encode(["uint256 swapFeePercentage"], [fee])

const logsMatchEvent = {
  address: poolAddress,
  topics: [ eventTopic ],
  data
}
const logsNoMatchEvent = {
  address: poolAddress,
  topics: [ '0x0' ],
}

describe("pause state change agent", () => {
  let handleTransaction

  const mockContract = {
    getVault: jest.fn(),
    name: jest.fn()
  }

  const mockCreateContract = () => mockContract

  const createTxEvent = ({ logs, addresses }) =>
    createTransactionEvent({
      receipt: { logs },
      addresses
    })

  beforeAll(() => {
    handleTransaction = provideHandleTransaction(mockCreateContract)
  })

  describe("handleTransaction", () => {
    it("returns empty findings if no SwapFeePercentageChanged event", async () => {
      const txEvent = createTxEvent({
        logs: [logsNoMatchEvent],
        addresses: { [poolAddress]: true }
      })

      const findings = await handleTransaction(txEvent)

      expect(findings).toStrictEqual([])
    })

    it("returns a finding on SwapFeePercentageChanged event", async () => {
      const txEvent = createTxEvent({
        logs: [logsMatchEvent],
        addresses: { [poolAddress]: true, [vaultAddress]: true }
      })

      mockContract.getVault.mockReturnValueOnce(vaultAddress)
      mockContract.name.mockReturnValueOnce(poolName)
      const findings = await handleTransaction(txEvent)

      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: "Balancer Pool Swap Fee Percentage Changed",
          description: `New swap fee for ${poolName}: 0.33%`,
          alertId: "BALANCER-SWAP-FEE-PERCENTAGE-CHANGED",
          protocol: "balancer",
          type: FindingType.Info,
          severity: FindingSeverity.Medium,
          metadata: {
            address: poolAddress,
            fee: '0.33',
          },
        }),
      ])
    })
  })
})
