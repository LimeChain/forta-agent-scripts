const contractUpgraded = require('./contract-upgraded');
const poolUpgraded = require('./pool-upgraded');

async function initialize() {
  await poolUpgraded.initialize();
}

function provideHandleTransaction(contractUpgradedAgent) {
  return async function handleTransaction(txEvent) {
    const findings = await contractUpgradedAgent.handleTransaction(txEvent);

    return findings;
  };
}

function provideHandleBlock(poolUpgradedAgent) {
  return async function handleBlock(blockEvent) {
    const findings = await poolUpgradedAgent.handleBlock(blockEvent);

    return findings;
  };
}

module.exports = {
  initialize,
  provideHandleTransaction,
  handleTransaction: provideHandleTransaction(contractUpgraded),
  provideHandleBlock,
  handleBlock: provideHandleBlock(poolUpgraded),
};
