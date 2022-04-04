const { Contract, Provider } = require('ethers-multicall');
const axios = require('axios').default;
const {
  Finding,
  FindingSeverity,
  FindingType,
  getEthersProvider,
  ethers,
} = require('forta-agent');

const ethcallProvider = new Provider(getEthersProvider(), 1);

const poolFactory = '0x1391d9223e08845e536157995085fe0cef8bd393';
const topic = '0x4f2ce4e40f623ca765fc0167a25cb7842ceaafb8d82d3dec26ca0d0e0d2d4896'; // PoolCreated event
const etherscanUrl = `https://api.etherscan.io/api?module=logs&action=getLogs&fromBlock=12471560&toBlock=latest&address=${poolFactory}&topic0=${topic}&apikey=YourApiKeyToken`;

const poolAbi = [
  'function symbol() external view returns (string memory)',
  'function decimals() external view returns (uint8)',
];

module.exports = {
  joinedEventSig: 'event Joined(address indexed staker, uint256 deposited, uint256 minted)',
  exitedEventSig: 'event Exited(address indexed staker, uint256 amount)',

  getPools: async () => {
    // Get the addresses of the pools from Etherscan
    const results = (await axios.get(etherscanUrl)).data.result;
    const poolAddresses = results.map((result) => {
      const { pool } = ethers.utils.defaultAbiCoder.decode(['address token', 'address pool'], result.data);
      return pool.toLowerCase();
    });

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
