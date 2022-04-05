const {
  adminEvents,
  createAlert,
  getPools,
} = require('./helper');

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

  const events = txEvent.filterLog(adminEvents, poolAddresses);

  events.forEach((event) => {
    const eventName = event.name;
    const poolName = pools[event.address];

    // Collect the event's args as "name: value"
    const args = Object.entries(event.args)
      .filter(([key]) => Number.isNaN(+key)) // Remove all number elements (they are indexes)
      .reduce((obj, [k, v]) => Object.assign(obj, { [k]: v }), {}); // Group all args

    findings.push(createAlert(eventName, poolName, args));
  });

  return findings;
};

module.exports = {
  initialize: provideInitialize(getPools),
  provideInitialize,
  handleTransaction,
};
