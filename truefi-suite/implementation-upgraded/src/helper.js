const { Contract, Provider } = require('ethers-multicall');
const axios = require('axios').default;
const {
  Finding,
  FindingSeverity,
  FindingType,
  getEthersProvider,
} = require('forta-agent');

const ethcallProvider = new Provider(getEthersProvider(), 1);

const subgraphUrl = 'https://api.thegraph.com/subgraphs/name/mikemccready/truefi-pools';
const payload = {
  query: `{
    poolValues(where: {id_not_in: ["TVL"]}) {
      id
    }
  }`,
};

const poolAbi = [
  'function symbol() external view returns (string memory)',
  'function implementation() public view returns (address)',
];

async function getImplementations(contracts) {
  const implementationCalls = contracts.map((contract) => contract.implementation());
  return ethcallProvider.all(implementationCalls);
}

module.exports = {
  getImplementations,

  getPools: async () => {
    // Get the addresses of the pools from the subgraph
    const response = await axios.post(subgraphUrl, JSON.stringify(payload));
    const poolAddresses = response.data.data.poolValues.map((pool) => pool.id.toLowerCase());

    const poolContracts = poolAddresses.map((address) => new Contract(address, poolAbi));

    // Get the symbol of each pool
    const nameCalls = poolContracts.map((contract) => contract.symbol());
    const names = await ethcallProvider.all(nameCalls);

    // Get the current implementation of each pool
    const implementations = await getImplementations(poolContracts);

    const pools = [];
    poolAddresses.forEach((_, i) => {
      pools.push({
        name: names[i],
        implementation: implementations[i],
        address: poolAddresses[i],
        contract: poolContracts[i],
      });
    });

    return pools;
  },

  createAlert: (pool, newImplementation) => Finding.fromObject({
    name: 'Pool implementation upgraded',
    description: `Implementation upgraded for pool ${pool.name}`,
    alertId: 'TRUEFI-POOL-IMPLEMENTATION-UPGRADED',
    protocol: 'truefi',
    severity: FindingSeverity.High,
    type: FindingType.Info,
    metadata: {
      name: pool.name,
      address: pool.address,
      newImplementation,
    },
  }),
};
