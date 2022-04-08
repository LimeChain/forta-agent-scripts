const {
  FindingType,
  FindingSeverity,
  Finding,
} = require('forta-agent');
const { handleTransaction } = require('./contract-upgraded');

const contract = 'Lender';
const address = '0xa606dd423df7dfb65efe14ab66f5fdebf62ff583';
const newImplementation = '0ximp';

describe('contract upgraded bot', () => {
  const mockTxEvent = { filterLog: jest.fn() };
  const upgradedEvent = {
    address: '0xa606dd423df7dfb65efe14ab66f5fdebf62ff583',
    args: {
      implementation: newImplementation,
    },
  };

  beforeEach(() => {
    mockTxEvent.filterLog.mockReset();
  });

  describe('handleTransaction', () => {
    it('returns empty findings there are no Upgraded events', async () => {
      mockTxEvent.filterLog.mockReturnValueOnce([]);
      const findings = await handleTransaction(mockTxEvent);

      expect(findings).toStrictEqual([]);
    });

    it('returns a finding if there is a Upgraded event', async () => {
      mockTxEvent.filterLog.mockReturnValueOnce([upgradedEvent]);
      const findings = await handleTransaction(mockTxEvent);

      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: 'Implementation upgraded',
          description: `Implementation upgraded for ${contract}`,
          alertId: 'TRUEFI-CONTRACT-IMPLEMENTATION-UPGRADED',
          protocol: 'truefi',
          severity: FindingSeverity.High,
          type: FindingType.Info,
          metadata: {
            contract,
            address,
            newImplementation,
          },
        }),
      ]);
    });
  });
});
