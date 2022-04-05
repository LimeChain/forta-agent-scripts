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

const poolAbi = ['function decimals() external view returns (uint8)'];

module.exports = {
  eventSigs: [
    'event Funded(address indexed pool, address loanToken, uint256 amount)',
    'event Reclaimed(address indexed pool, address loanToken, uint256 amount)',
  ],
  lenderAddress: '0xa606dd423df7dfb65efe14ab66f5fdebf62ff583',

  getPools: async () => {
    // Get the addresses of the pools from the subgraph
    const response = await axios.post(subgraphUrl, JSON.stringify(payload));
    const poolAddresses = response.data.data.poolValues.map((pool) => pool.id);

    const poolContracts = poolAddresses.map((address) => new Contract(address, poolAbi));

    // Get the decimals of each pool token
    const decimalsCalls = poolContracts.map((contract) => contract.decimals());
    const decimals = await ethcallProvider.all(decimalsCalls);

    const pools = {};
    poolAddresses.forEach((address, i) => {
      pools[address] = { decimals: decimals[i] };
    });

    return pools;
  },

  createFundedAlert: (loanToken, amount) => Finding.fromObject({
    name: 'Funded TrueFi loan',
    description: `Loan ${loanToken} is funded`,
    alertId: 'TRUEFI-LOAN-FUNDED',
    protocol: 'truefi',
    severity: FindingSeverity.High,
    type: FindingType.Info,
    metadata: {
      loanToken,
      amount,
    },
  }),

  createReclaimedAlert: (loanToken, amount) => Finding.fromObject({
    name: 'Reclaimed TrueFi loan',
    description: `Loan ${loanToken} is reclaimed`,
    alertId: 'TRUEFI-LOAN-RECLAIMED',
    protocol: 'truefi',
    severity: FindingSeverity.High,
    type: FindingType.Info,
    metadata: {
      loanToken,
      amount,
    },
  }),
};
