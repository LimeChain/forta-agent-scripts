const {
  FindingType,
  FindingSeverity,
  Finding,
  ethers,
} = require('forta-agent');
const { handleTransaction, provideInitialize } = require('./agent');

const staker = '0xstaker';
const poolAddress = '0xpool';
const poolName = 'tfTUSD';
const decimals = 18;
const amount = ethers.utils.parseUnits('100000', decimals);
const formatedAmount = parseFloat(
  ethers.utils.formatUnits(amount, decimals),
).toFixed(2);

describe('large joins and exits agent', () => {
  const mockTxEvent = { filterLog: jest.fn() };

  const joinEvent = {
    address: poolAddress,
    args: {
      staker,
      deposited: amount,
    },
  };

  const exitEvent = {
    address: poolAddress,
    args: {
      staker,
      amount,
    },
  };

  const pools = {};
  pools[poolAddress] = { name: poolName, decimals };

  const mockGetPools = () => pools;

  beforeAll(async () => {
    const initialize = provideInitialize(mockGetPools);
    await initialize();
  });

  beforeEach(() => {
    mockTxEvent.filterLog.mockReset();
  });

  describe('handleTransaction', () => {
    it('returns empty findings there are no joins and exits', async () => {
      mockTxEvent.filterLog.mockReturnValueOnce([]); // No joins
      mockTxEvent.filterLog.mockReturnValueOnce([]); // No exits
      const findings = await handleTransaction(mockTxEvent);

      expect(findings).toStrictEqual([]);
    });

    it('returns a finding if there is a large join event', async () => {
      mockTxEvent.filterLog.mockReturnValueOnce([joinEvent]);
      mockTxEvent.filterLog.mockReturnValueOnce([]); // No exits
      const findings = await handleTransaction(mockTxEvent);

      expect(findings).toStrictEqual([
        Finding.fromObject({
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
      ]);
    });

    it('returns a finding if there is a large exit event', async () => {
      mockTxEvent.filterLog.mockReturnValueOnce([]); // No joins
      mockTxEvent.filterLog.mockReturnValueOnce([exitEvent]);
      const findings = await handleTransaction(mockTxEvent);

      expect(findings).toStrictEqual([
        Finding.fromObject({
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
      ]);
    });
  });
});
