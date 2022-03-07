const {
  FindingType,
  FindingSeverity,
  Finding,
} = require("forta-agent")
const { handleTransaction } = require("./agent")

const fromAddress = "0xsomeaddress"
const xsLockerAddress = "0x501ace47c5b0c2099c4464f681c3fa2ecd3146c1"
const withdrawMethodSignature = "0x00f714ce"

const txEventWithoutWithdraw = {
  transaction: {
    from: fromAddress,
    to: xsLockerAddress,
    gas: "0x100",
    data: "0xsomedata"
  },
  receipt: {
    status: true,
    gasUsed: "0x99"
  }
}

const txEventWithWithdraw = {
  transaction: {
    from: fromAddress,
    to: xsLockerAddress,
    gas: "0x100",
    data: withdrawMethodSignature,
  },
  receipt: {
    status: false,
    gasUsed: "0x99"
  }
}

describe("xsLocker reverted withdraw", () => {
  describe("handleTransaction", () => {
    it("returns empty findings there is no withdraw from a locked lock", async () => {
      const findings = await handleTransaction(txEventWithoutWithdraw)
      expect(findings).toStrictEqual([])
    })

    it("returns a finding if there is an attempt to withdraw from a locked lock", async () => {
      const findings = await handleTransaction(txEventWithWithdraw)
      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: "xsLocker attempt to withdraw from a locked lock",
          description: `Address ${fromAddress} tried to withdraw from a locked lock`,
          alertId: "SOLACE-XS-LOCKER-REVERTED-WITHDRAW",
          protocol: "solace",
          severity: FindingSeverity.Medium,
          type: FindingType.Info,
          metadata: {
            from: fromAddress
          },
        }),
      ])
    })
  })
})
