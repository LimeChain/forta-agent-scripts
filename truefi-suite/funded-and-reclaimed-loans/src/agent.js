const { ethers } = require('forta-agent');
const {
  eventSigs,
  lenderAddress,
  createFundedAlert,
  createReclaimedAlert,
  getPools,
} = require('./helper');

let pools;
function provideInitialize(initPools) {
  return async function initialize() {
    pools = await initPools();
  };
}

const handleTransaction = async (txEvent) => {
  const findings = [];

  const events = txEvent.filterLog(eventSigs, lenderAddress);

  events.forEach((event) => {
    const { pool, loanToken, amount } = event.args;

    const usdAmount = parseFloat(
      ethers.utils.formatUnits(amount, pools[pool].decimals),
    ).toFixed(2);

    if (event.name === 'Funded') {
      findings.push(createFundedAlert(loanToken, usdAmount));
    } else {
      findings.push(createReclaimedAlert(loanToken, usdAmount));
    }
  });

  return findings;
};

module.exports = {
  initialize: provideInitialize(getPools),
  provideInitialize,
  handleTransaction,
};
