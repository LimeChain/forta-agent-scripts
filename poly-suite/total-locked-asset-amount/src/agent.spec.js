const {
  FindingType,
  FindingSeverity,
  Finding,
  ethers
} = require("forta-agent")
const { provideHandleBlock } = require("./agent")

const config = {
  chains: {
    'eth': { 'lockProxy': 'lll' },
    'bsc': { 'lockProxy': 'lll' }
  },
  tokens: [
    {
      'name': 'asd',
      'sourceChain': 'eth',
      'decimals': 18,
      'destinationChains': [
        {
          'chain': 'bsc',
          'address': 'aaa',
          'initialBalance': '1000'
        },
      ]
    }
  ]
}

const contractsMock = {
  'asd': {
    'eth': { 'balanceOf': jest.fn() },
    'bsc': { 'balanceOf': jest.fn() }
  }
}

const ethBalance = ethers.utils.parseUnits("100", 18)
const wrongBscBalance = ethers.utils.parseUnits("20", 18)
const correctBscBalance = ethers.utils.parseUnits("900", 18)

// The locked balance         = ethBalance        = 100
// The wrong unlocked balance = initial - wrong   = 980
const initialBalance = ethers.utils.parseUnits("1000", 18)
const wrongUnlockedBalance = initialBalance.sub(wrongBscBalance)

describe("total locked asset amount agent", () => {
  describe("handleBlock", () => {
    it("should return a finding if locked and unlocked balances are different", async () => {

      contractsMock['asd']['eth'].balanceOf.mockReturnValueOnce(ethBalance)
      contractsMock['asd']['bsc'].balanceOf.mockReturnValueOnce(wrongBscBalance)

      const handleBlock = provideHandleBlock(config, contractsMock)

      // we wait 10 ms after the first call because we need time to update the alerts array
      await handleBlock()
      await new Promise(resolve => setTimeout(resolve, 10))
      const findings = await handleBlock()

      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: "Poly Locked Amount Less Than Unlocked",
          description: `The locked amount in the source chain is less than the total unlock amount in the destination chains`,
          alertId: "POLY-LOCKED-AMOUNT-LESS-THAN-UNLOCKED",
          protocol: "poly",
          type: FindingType.Exploit,
          severity: FindingSeverity.Critical,
          metadata: {
            token: 'asd',
            lockedAmount: ethBalance.toHexString(),
            unlockedAmount: wrongUnlockedBalance.toHexString(),
          },
        }),
      ])
    })

    it("should not return a finding if locked and unlocked balances are the same", async () => {

      contractsMock['asd']['eth'].balanceOf.mockReturnValueOnce(ethBalance)
      contractsMock['asd']['bsc'].balanceOf.mockReturnValueOnce(correctBscBalance)

      const handleBlock = provideHandleBlock(config, contractsMock)

      // we wait 10 ms after the first call because we need time to update the alerts array
      await handleBlock()
      await new Promise(resolve => setTimeout(resolve, 10))
      const findings = await handleBlock()

      // Locked balance = 100
      // Unlocked balance = initial - correct = 100
      expect(findings).toStrictEqual([])
    })
  })
})
