import {
  BlockEvent,
  Finding,
  HandleBlock,
  HandleTransaction,
  TransactionEvent,
  FindingSeverity,
  FindingType,
  ethers,
  getTransactionReceipt,
} from "forta-agent";

const { getMarkets } = require("./helper");

const GAS_USED_THRESHOLD = ethers.BigNumber.from(3_000_000);

let markets;
let marketsAddresses: Array<any> = [];

function provideInitialize(getMarkets: Function): Function {
  return async function initialize() {
    markets = await getMarkets();
    marketsAddresses = Object.keys(markets);
  };
}

function provideHandleTransaction(getTxReceipt: Function): Function {
  return async function handleTransaction(
    txEvent: TransactionEvent
  ): Promise<any> {
    const findings: Array<Finding> = [];
    const hasIronBankInteraction = marketsAddresses.some(
      (market: string) => txEvent.addresses[market]
    );

    if (!hasIronBankInteraction) return findings;

    const txReceipt = await getTxReceipt(txEvent.hash);
    const gasUsed = ethers.BigNumber.from(txReceipt.gasUsed);

    if (gasUsed.gt(GAS_USED_THRESHOLD)) {
      findings.push(
        Finding.fromObject({
          name: "High gas",
          description: `Gas used is > 3M`,
          alertId: "IRON-BANK-HIGH-GAS",
          protocol: "iron-bank",
          severity: FindingSeverity.Medium,
          type: FindingType.Info,
          metadata: {
            gasUsed: gasUsed.toString(),
          },
        })
      );
    }

    return findings;
  };
}

module.exports = {
  initialize: provideInitialize(getMarkets),
  provideInitialize,
  handleTransaction: provideHandleTransaction(getTransactionReceipt),
  provideHandleTransaction,
};
