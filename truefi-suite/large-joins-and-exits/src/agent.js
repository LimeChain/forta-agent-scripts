const { ethers } = require('forta-agent');
const {
  joinedEventSig,
  exitedEventSig,
  createJoinAlert,
  createExitAlert,
  getPools,
} = require('./helper');

const AMOUNT_THRESHOLD = 10_000;

let pools;
let poolAddresses;
function provideInitialize(initPools) {
  return async function initialize() {
    pools = await initPools();
    poolAddresses = Object.keys(pools);
  };
}

const handleTransaction = async (txEvent) => {
  const findings = [];

  const joins = txEvent.filterLog(joinedEventSig, poolAddresses);

  joins.forEach((event) => {
    const { staker, deposited } = event.args;
    const { name, decimals } = pools[event.address];

    // Convert the amount from BigNumber to float
    const formatedAmount = parseFloat(
      ethers.utils.formatUnits(deposited, decimals),
    ).toFixed(2);

    if (formatedAmount > AMOUNT_THRESHOLD) {
      findings.push(createJoinAlert(staker, name, formatedAmount));
    }
  });

  const exits = txEvent.filterLog(exitedEventSig, poolAddresses);

  exits.forEach((event) => {
    const { staker, amount } = event.args;
    const { name, decimals } = pools[event.address];

    // Convert the amount from BigNumber to float
    const formatedAmount = parseFloat(
      ethers.utils.formatUnits(amount, decimals),
    ).toFixed(2);

    if (formatedAmount > AMOUNT_THRESHOLD) {
      findings.push(createExitAlert(staker, name, formatedAmount));
    }
  });

  return findings;
};

module.exports = {
  initialize: provideInitialize(getPools),
  provideInitialize,
  handleTransaction,
};
