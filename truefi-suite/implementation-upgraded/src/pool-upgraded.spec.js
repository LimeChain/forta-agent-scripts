const {
  FindingType,
  FindingSeverity,
  Finding,
} = require('forta-agent');
const { handleBlock, provideInitialize } = require('./pool-upgraded');

const name = 'tfTUSD';
const address = '0xaddress';
const oldImplementation = '0xold';
const newImplementation = '0xnew';

describe('pool upgraded bot', () => {
  const blockEvent = { blockNumber: 200 };

  const pools = [
    {
      name,
      implementation: oldImplementation,
      address,
    },
  ];
  const mockGetPools = () => pools;

  const mockGetImplementations = jest.fn();

  beforeAll(async () => {
    const initialize = provideInitialize(mockGetPools, mockGetImplementations);
    await initialize();
  });

  describe('handleBlock', () => {
    it('returns empty findings if the the implementation has not changed', async () => {
      mockGetImplementations.mockResolvedValueOnce([oldImplementation]);
      const findings = await handleBlock(blockEvent);

      expect(findings).toStrictEqual([]);
    });

    it('returns a finding if the the implementation has changed', async () => {
      mockGetImplementations.mockResolvedValueOnce([newImplementation]);
      const findings = await handleBlock(blockEvent);

      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: 'Pool implementation upgraded',
          description: `Implementation upgraded for pool ${name}`,
          alertId: 'TRUEFI-POOL-IMPLEMENTATION-UPGRADED',
          protocol: 'truefi',
          severity: FindingSeverity.High,
          type: FindingType.Info,
          metadata: {
            name,
            address,
            newImplementation,
          },
        }),
      ]);
    });
  });
});
