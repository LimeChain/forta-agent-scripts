const { ethers } = require('forta-agent');
const {
  joinedEventSig,
  exitedEventSig,
  createJoinAlert,
  createExitAlert,
  getPools,
} = require('./helper');

// Hardcode the lending pools for now
// const lendingPools = {
//   '0x97ce06c3e3d027715b2d6c22e67d5096000072e5': {
//     name: 'tfTUSD',
//     tokenDecimals: 18,
//   },
//   '0xa991356d261fbaf194463af6df8f0464f8f1c742': {
//     name: 'tfUSDC',
//     tokenDecimals: 6,
//   },
//   '0x6002b1dcb26e7b1aa797a17551c6f487923299d7': {
//     name: 'tfUSDT',
//     tokenDecimals: 18,
//   },
//   '0x1ed460d149d48fa7d91703bf4890f97220c09437': {
//     name: 'tfBUSD',
//     tokenDecimals: 18,
//   },
//   '0xa1e72267084192db7387c8cc1328fade470e4149': {
//     name: 'Legacy tfTUSD',
//     tokenDecimals: 18,
//   },
// };

// const lendingPoolAddresses = Object.keys(lendingPools);

const AMOUNT_THRESHOLD = 10_000;

// initialize
// call etherscan? :(, get all PoolCreated events and add the markets to a list
// for each market get the name (symbol) and the decimals
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
