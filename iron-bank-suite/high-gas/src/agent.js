const {
  Finding,
  FindingSeverity,
  FindingType,
  ethers,
  getTransactionReceipt,
} = require("forta-agent");
const { getMarkets } = require("./helper");

const GAS_USED_THRESHOLD = ethers.BigNumber.from(3_000_000);

let markets;
let marketsAddresses;

function provideInitialize(getMarkets) {
  return async function initialize() {
    markets = await getMarkets();
    marketsAddresses = Object.keys(markets);
  };
}

function provideHandleTransaction(getTxReceipt) {
  return async function handleTransaction(txEvent) {
    const findings = [];

    // Check if an Iron Bank market is involved in the transaction
    const hasIronBankInteraction = marketsAddresses.some(
      (market) => txEvent.addresses[market]
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
