const {
  FindingType,
  FindingSeverity,
  Finding,
  ethers,
} = require("forta-agent")
const { handleBlock, provideInitialize } = require("./agent")

const blockEvent = { blockNumber: 5 * 60 * 24 }

// reward per year is 10m
const rewardPerSecond = ethers.BigNumber.from("317097919837645865")
const highBalance = ethers.utils.parseEther("10000000") // 10m
const lowBalance = ethers.utils.parseEther("1000000") // 1m

describe("staking rewards low balance agent", () => {
  const mockProvider = { all: jest.fn() }
  const mockGetProvider = () => mockProvider

  beforeAll(async () => {
    const initialize = provideInitialize(mockGetProvider)
    await initialize()
  })

  beforeEach(() => {
    mockProvider.all.mockReset()
  })

  describe("handleBlock", () => {
    it("returns empty findings if Solace balance is high", async () => {
      mockProvider.all.mockReturnValueOnce([rewardPerSecond, highBalance])

      const findings = await handleBlock(blockEvent)
      expect(findings).toStrictEqual([])
    })

    it("returns a finding if Solace balance is low", async () => {
      mockProvider.all.mockReturnValueOnce([rewardPerSecond, lowBalance])

      const findings = await handleBlock(blockEvent)
      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: "Staking rewards contract has low Solace balance",
          description: `The Solace balance of the Staking rewards contract is ` + 
          `less than 20% of the reward per year`,
          alertId: "SOLACE-STAKING-REWARDS-LOW-BALANCE",
          protocol: "solace",
          severity: FindingSeverity.High,
          type: FindingType.Info,
          metadata: {
            percentage: 10
          },
        }),
      ])
    })
  })
})
