const { FindingType, FindingSeverity, Finding } = require("forta-agent");
const { provideHandleTransaction } = require("./agent");

const fromAddress = "0xsomeaddress";
const xsLockerAddress = "0x501ace47c5b0c2099c4464f681c3fa2ecd3146c1";
const withdrawMethodSignature = "0x00f714ce";

const txEventWithoutWithdraw = {
  hash: "0x0",
  transaction: {
    from: fromAddress,
    to: xsLockerAddress,
    gas: "0x100",
    data: "0xsomedata",
  },
};

const txEventWithWithdraw = {
  hash: "0x0",
  transaction: {
    from: fromAddress,
    to: xsLockerAddress,
    gas: "0x100",
    data: withdrawMethodSignature,
  },
};

const txEventWithoutXsLockerAddress = {
  hash: "0x0",
  transaction: {
    from: fromAddress,
    to: "0x2",
    gas: "0x100",
    data: withdrawMethodSignature,
  },
};

describe("xsLocker reverted withdraw", () => {
  describe("handleTransaction", () => {
    let handleTransaction;
    const mockTxReceipt = jest.fn();

    beforeAll(() => {
      handleTransaction = provideHandleTransaction(mockTxReceipt);
    });

    it("returns empty findings if 'to' is not to xsLockerAddress", async () => {
      const findings = await handleTransaction(txEventWithoutXsLockerAddress);
      expect(findings).toStrictEqual([]);
    });

    it("returns empty findings if status is successful", async () => {
      mockTxReceipt.mockResolvedValueOnce({ status: true, gasUsed: "0x99" });
      const findings = await handleTransaction(txEventWithWithdraw);
      expect(findings).toStrictEqual([]);
    });

    it("returns empty findings if tx ran out of gas (gas == gasUsed)", async () => {
      mockTxReceipt.mockResolvedValueOnce({ status: false, gasUsed: "0x100" });
      const findings = await handleTransaction(txEventWithWithdraw);
      expect(findings).toStrictEqual([]);
    });

    it("returns empty findings there is no withdraw from a locked lock", async () => {
      const findings = await handleTransaction(txEventWithoutWithdraw);
      expect(findings).toStrictEqual([]);
    });

    it("returns a finding if there is an attempt to withdraw from a locked lock", async () => {
      mockTxReceipt.mockResolvedValue({ status: false, gasUsed: "0x99" });
      const findings = await handleTransaction(txEventWithWithdraw);
      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: "xsLocker attempt to withdraw from a locked lock",
          description: `Address ${fromAddress} tried to withdraw from a locked lock`,
          alertId: "SOLACE-XS-LOCKER-REVERTED-WITHDRAW",
          protocol: "solace",
          severity: FindingSeverity.Medium,
          type: FindingType.Info,
          metadata: {
            from: fromAddress,
          },
        }),
      ]);
    });
  });
});
