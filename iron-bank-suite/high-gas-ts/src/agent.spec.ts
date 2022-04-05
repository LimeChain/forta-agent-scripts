const {
  FindingType,
  FindingSeverity,
  Finding,
  HandleTransaction,
  TransactionEvent,
} = require("forta-agent");

import { HandleTransaction } from "forta-agent";
import { encodeEventSignature, encodeParameter } from "forta-agent-tools";

const tokenAbi: string[] = [
  "function symbol() external view returns (string memory)",
  "function underlying() public view returns (address)",
  "function decimals() external view returns (uint8)",
];

import {
  createAddress,
  TestTransactionEvent,
} from "forta-agent-tools/lib/tests";

const { provideHandleTransaction, provideInitialize } = require("./agent");

const market = "0x41c84c0e2ee0b740cf0d31f63f3b6f627dc6b393";

describe("high-gas agent", () => {
  let handleTransaction: HandleTransaction;
  const markets: {
    [key: string]: { name: string; decimalsUnderlying: number };
  } = {};

  markets[market] = {
    name: "cyWETH",
    decimalsUnderlying: 18,
  };
  const mockGetMarkets = () => markets;

  const mockGetTxReceipt = jest.fn();

  beforeAll(async () => {
    const initialize = provideInitialize(mockGetMarkets);
    await initialize();
    handleTransaction = provideHandleTransaction(mockGetTxReceipt);
  });

  describe("handleTransaction", () => {
    it("returns empty findings if there isn't a high gas usage", async () => {
      const gasUsedDecimal = 100_000;
      const gasUsed = `0x${gasUsedDecimal.toString(16)}`;
      mockGetTxReceipt.mockResolvedValueOnce({ gasUsed });
      const txEvent = new TestTransactionEvent();
      txEvent.setFrom("0x0");
      txEvent.addEventLog(encodeEventSignature(tokenAbi[0]), "0x2", "0x");

      const findings = await handleTransaction(txEvent);

      expect(findings).toStrictEqual([]);
    });

    it("returns a finding if there is a high gas usage", async () => {
      const gasUsedDecimal = 4_000_000;
      const gasUsed = `0x${gasUsedDecimal.toString(16)}`;
      mockGetTxReceipt.mockResolvedValueOnce({ gasUsed });
      const txEvent = createTxEvent({
        addresses: { [market]: true },
      });
      const findings = await handleTransaction(txEvent);

      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: "High gas",
          description: `Gas used is > 3M`,
          alertId: "IRON-BANK-HIGH-GAS",
          protocol: "iron-bank",
          severity: FindingSeverity.Medium,
          type: FindingType.Info,
          metadata: {
            gasUsed: gasUsedDecimal.toString(),
          },
        }),
      ]);
    });
  });
});
