/* eslint no-param-reassign: ["error", { "props": false }] */
const {
  createAlert,
  getPools,
  getImplementations,
} = require('./helper');

let pools;
let poolContracts;
let getNewImplementations;
function provideInitialize(initPools, getImplementationsFn) {
  return async function initialize() {
    pools = await initPools();
    poolContracts = pools.map((pool) => pool.contract);
    getNewImplementations = getImplementationsFn;
  };
}

async function handleBlock(blockEvent) {
  const findings = [];

  // 5 per minute * 10 minutes
  if (blockEvent.blockNumber % 50 !== 0) return findings;

  const newImplementations = await getNewImplementations(poolContracts);

  pools.forEach((pool, i) => {
    if (pool.implementation !== newImplementations[i]) {
      findings.push(createAlert(pool, newImplementations[i]));

      // Update the pool's implementation
      pool.implementation = newImplementations;
    }
  });

  return findings;
}

module.exports = {
  initialize: provideInitialize(getPools, getImplementations),
  provideInitialize,
  handleBlock,
};
