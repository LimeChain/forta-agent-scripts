const { Contract, Provider } = require('ethers-multicall');
const {
  Finding,
  FindingSeverity,
  FindingType,
  getEthersProvider,
} = require('forta-agent');

const ethcallProvider = new Provider(getEthersProvider(), 1);

const poolAbi = [
  'function symbol() external view returns (string memory)',
  'function decimals() external view returns (uint8)',
];

module.exports = {
  joinedEventSig: 'event Joined(address indexed staker, uint256 deposited, uint256 minted)',
  exitedEventSig: 'event Exited(address indexed staker, uint256 amount)',

  getPools: async () => {
    const poolAddresses = [
      '0x97ce06c3e3d027715b2d6c22e67d5096000072e5',
      '0xa991356d261fbaf194463af6df8f0464f8f1c742',
      '0x6002b1dcb26e7b1aa797a17551c6f487923299d7',
      '0x1ed460d149d48fa7d91703bf4890f97220c09437',
    ];

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
