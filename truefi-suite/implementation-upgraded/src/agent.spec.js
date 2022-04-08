const { provideHandleTransaction, provideHandleBlock } = require('./agent');

describe('implementation upgraded bot', () => {
  let handleTransaction;
  let handleBlock;
  const mockContractUpgradedBot = { handleTransaction: jest.fn() };
  const mockPoolUpgradedBot = { handleBlock: jest.fn() };
  const mockTxEvent = { some: 'event' };
  const mockBlockEvent = { some: 'event' };

  beforeAll(() => {
    handleTransaction = provideHandleTransaction(mockContractUpgradedBot);
    handleBlock = provideHandleBlock(mockPoolUpgradedBot);
  });

  describe('handleTransaction', () => {
    it('invokes contractUpgradedBot and returns its finding', async () => {
      const mockFinding = { some: 'finding' };
      mockContractUpgradedBot.handleTransaction.mockResolvedValueOnce([mockFinding]);

      const findings = await handleTransaction(mockTxEvent);

      expect(findings).toStrictEqual([mockFinding]);
      expect(mockContractUpgradedBot.handleTransaction).toHaveBeenCalledTimes(1);
      expect(mockContractUpgradedBot.handleTransaction).toHaveBeenCalledWith(mockTxEvent);
    });
  });

  describe('handleBlock', () => {
    it('invokes poolUpgradedBot and returns its finding', async () => {
      const mockFinding = { some: 'finding' };
      mockPoolUpgradedBot.handleBlock.mockResolvedValueOnce([mockFinding]);

      const findings = await handleBlock(mockBlockEvent);

      expect(findings).toStrictEqual([mockFinding]);
      expect(mockPoolUpgradedBot.handleBlock).toHaveBeenCalledTimes(1);
      expect(mockPoolUpgradedBot.handleBlock).toHaveBeenCalledWith(mockBlockEvent);
    });
  });
});
