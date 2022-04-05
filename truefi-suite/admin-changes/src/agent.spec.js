const {
  FindingType,
  FindingSeverity,
  Finding,
} = require('forta-agent');
const { handleTransaction, provideInitialize } = require('./agent');

const poolAddress = '0xpool';
const poolName = 'tfTUSD';
const safuAddress = '0xsafu';
const eventName = 'SafuChanged';
const args = { newSafu: safuAddress };

describe('admin changes agent', () => {
  const mockTxEvent = { filterLog: jest.fn() };

  const safuChangedEvent = {
    name: eventName,
    address: poolAddress,
    args,
  };

  const pools = { [poolAddress]: poolName };
  const mockGetPools = () => pools;

  beforeAll(async () => {
    const initialize = provideInitialize(mockGetPools);
    await initialize();
  });

  beforeEach(() => {
    mockTxEvent.filterLog.mockReset();
  });

  describe('handleTransaction', () => {
    it('returns empty findings there are admin events', async () => {
      mockTxEvent.filterLog.mockReturnValueOnce([]);
      const findings = await handleTransaction(mockTxEvent);

      expect(findings).toStrictEqual([]);
    });

    it('returns a finding if there is an admin event', async () => {
      mockTxEvent.filterLog.mockReturnValueOnce([safuChangedEvent]);
      const findings = await handleTransaction(mockTxEvent);

      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: `${eventName} for pool ${poolName}`,
          description: `Event ${eventName} emitted from pool ${poolName}`,
          alertId: 'TRUEFI-ADMIN-CHANGES',
          protocol: 'truefi',
          severity: FindingSeverity.High,
          type: FindingType.Info,
          metadata: {
            event: eventName,
            pool: poolName,
            args,
          },
        }),
      ]);
    });
  });
});
