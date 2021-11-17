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
  tokens: {
    'asd': {
      'sourceChain': 'eth',
      'destinationChains': {
        'bsc': {
          'address': 'aaa',
          'initialBalance': '1000'
        },
      }
    }
  }
}

const contractsMock = {
  'asd': {
    'eth': { 'balanceOf': jest.fn() },
    'bsc': { 'balanceOf': jest.fn() }
  }
}

const ethBalance = ethers.utils.parseUnits("100", 18)
const bscBalance = ethers.utils.parseUnits("20", 18)

// The locked balance   = ethBalance    = 100
// The unlocked balance = initial - bsc = 980
const initialBalance = ethers.utils.parseUnits("1000", 18)
const unlockedBalance = initialBalance.sub(bscBalance)

describe("total locked asset amount agent", () => {
  describe("handleBlock", () => {
    it("should returns a finding if locked and unlocked balances are different", async () => {

      contractsMock['asd']['eth'].balanceOf.mockReturnValueOnce(ethBalance)
      contractsMock['asd']['bsc'].balanceOf.mockReturnValueOnce(bscBalance)

      const handleBlock = provideHandleBlock(config, contractsMock)

      // we wait 100 ms after the first call because we need time to update the alerts array
      await handleBlock()
      await jest.setTimeout(100)
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
            unlockedAmount: unlockedBalance.toHexString(),
          },
        }),
      ])
    })
  })
})
