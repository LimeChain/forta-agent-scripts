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
  'function decimals() external view returns (uint8)',
];

module.exports = {
  joinedEventSig: 'event Joined(address indexed staker, uint256 deposited, uint256 minted)',
  exitedEventSig: 'event Exited(address indexed staker, uint256 amount)',

  getPools: async () => {
    // Get the addresses of the pools from the subgraph
    const response = await axios.post(subgraphUrl, JSON.stringify(payload));
    const poolAddresses = response.data.data.poolValues.map((pool) => pool.id.toLowerCase());

    const poolContracts = poolAddresses.map((address) => new Contract(address, poolAbi));

    // Get the symbol of each pool
    const nameCalls = poolContracts.map((contract) => contract.symbol());
    const names = await ethcallProvider.all(nameCalls);

    // Get the decimals of each pool token
    const decimalsCalls = poolContracts.map((contract) => contract.decimals());
    const decimals = await ethcallProvider.all(decimalsCalls);

    const pools = {};
    poolAddresses.forEach((address, i) => {
      pools[address] = { name: names[i], decimals: decimals[i] };
    });

    return pools;
  },

  createJoinAlert: (staker, poolName, formatedAmount) => Finding.fromObject({
    name: `Large join in pool ${poolName}`,
    description: `Account ${staker} deposited $${formatedAmount} in ${poolName}`,
    alertId: 'TRUEFI-LARGE-JOIN',
    protocol: 'truefi',
    severity: FindingSeverity.Medium,
    type: FindingType.Info,
    metadata: {
      account: staker,
      pool: poolName,
      amount: formatedAmount,
    },
  }),

  createExitAlert: (staker, poolName, formatedAmount) => Finding.fromObject({
    name: `Large exit from pool ${poolName}`,
    description: `Account ${staker} withdrew $${formatedAmount} from ${poolName}`,
    alertId: 'TRUEFI-LARGE-EXIT',
    protocol: 'truefi',
    severity: FindingSeverity.Medium,
    type: FindingType.Info,
    metadata: {
      account: staker,
      pool: poolName,
      amount: formatedAmount,
    },
  }),
};
