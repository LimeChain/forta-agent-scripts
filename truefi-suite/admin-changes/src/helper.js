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

const poolAbi = ['function symbol() external view returns (string memory)'];

module.exports = {
  adminEvents: [
    'event JoiningFeeChanged(uint256 newFee)',
    'event BeneficiaryChanged(address newBeneficiary)',
    'event OracleChanged(address newOracle)',
    'event PauseStatusChanged(bool pauseStatus)',
    'event SafuChanged(address newSafu)',
    'event CreditAgencyChanged(address newCreditAgency)',
  ],

  getPools: async () => {
    // Get the addresses of the pools from the subgraph
    const response = await axios.post(subgraphUrl, JSON.stringify(payload));
    const poolAddresses = response.data.data.poolValues.map((pool) => pool.id.toLowerCase());

    const poolContracts = poolAddresses.map((address) => new Contract(address, poolAbi));

    // Get the symbol of each pool
    const nameCalls = poolContracts.map((contract) => contract.symbol());
    const names = await ethcallProvider.all(nameCalls);

    const pools = {};
    poolAddresses.forEach((address, i) => {
      pools[address] = names[i];
    });

    return pools;
  },

  createAlert: (event, pool, args) => Finding.fromObject({
    name: `${event} for pool ${pool}`,
    description: `Event ${event} emitted from pool ${pool}`,
    alertId: 'TRUEFI-ADMIN-CHANGES',
    protocol: 'truefi',
    severity: FindingSeverity.High,
    type: FindingType.Info,
    metadata: {
      event,
      pool,
      args,
    },
  }),
};
