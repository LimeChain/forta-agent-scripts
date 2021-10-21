const {
  FindingType,
  FindingSeverity,
  Finding,
} = require("forta-agent")
const { handleBlock, provideHandleInitialize } = require("./agent")
const { ethers } = require("ethers")

const one = ethers.BigNumber.from(1)
const two = ethers.BigNumber.from(2)

describe("oracle agent", () => {
  const mockContract = {
    getLatest: jest.fn(),
    getTimeWeightedAverage: jest.fn()
  }

  const mockCreateContract = () => mockContract

  beforeAll(async () => {
    initialize = provideHandleInitialize(mockCreateContract)
    await initialize()
  })

  beforeEach(() => {
    mockContract.getLatest.mockReset()
    mockContract.getTimeWeightedAverage.mockReset()
  })

  describe("handleBlock", () => {
    it("returns empty findings if the prices are close", async () => {

      // Equal prices
      mockContract.getLatest.mockReturnValue(one)
      mockContract.getTimeWeightedAverage.mockReturnValue([one])

      const findings = await handleBlock()

      // Expect to be called 3 times because we watch 3 pools
      expect(mockContract.getLatest).toHaveBeenCalledTimes(3)
      expect(mockContract.getTimeWeightedAverage).toHaveBeenCalledTimes(3)
      expect(findings).toStrictEqual([])
    })

    it("returns a finding if there is price disparity", async () => {

      mockContract.getLatest.mockReturnValueOnce(two)
      mockContract.getLatest.mockReturnValue(one)
      mockContract.getTimeWeightedAverage.mockReturnValue([one])

      const findings = await handleBlock()

      expect(mockContract.getLatest).toHaveBeenCalledTimes(3)
      expect(mockContract.getTimeWeightedAverage).toHaveBeenCalledTimes(3)

      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: "Balancer Oracle Disparity",
          description: `The difference between the instant and the resilient prices for pool B_50WBTC_50WETH is 100.00%`,
          alertId: "BALANCER-ORACLE-DISPARITY",
          protocol: "balancer",
          type: FindingType.Suspicious,
          severity: FindingSeverity.Medium,
          metadata: {
            poolName: "B_50WBTC_50WETH",
            instantPrice: two,
            resilientPrice: [one],
            percentageDiff: "100.00"
          },
        }),
      ])
    })
  })
})
