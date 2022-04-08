const {
  FindingType,
  FindingSeverity,
  Finding,
  ethers,
} = require('forta-agent');
const { handleTransaction, provideInitialize } = require('./agent');

const poolAddress = '0xpool';
const poolName = 'tfTUSD';
const loanToken = '0xloan';
const decimals = 18;
const amount = ethers.utils.parseUnits('100000', decimals);
const formatedAmount = parseFloat(
  ethers.utils.formatUnits(amount, decimals),
).toFixed(2);

const args = { pool: poolAddress, loanToken, amount };

describe('funded and reclaimed loans agent', () => {
  const mockTxEvent = { filterLog: jest.fn() };
  const fundedEvent = { name: 'Funded', args };
  const reclaimedEvent = { name: 'Reclaimed', args };

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
    it('returns empty findings there are no Funded or Reclaimed events', async () => {
      mockTxEvent.filterLog.mockReturnValueOnce([]);
      const findings = await handleTransaction(mockTxEvent);

      expect(findings).toStrictEqual([]);
    });

    it('returns a finding if there is a Funded event', async () => {
      mockTxEvent.filterLog.mockReturnValueOnce([fundedEvent]);
      const findings = await handleTransaction(mockTxEvent);

      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: 'Funded TrueFi loan',
          description: `Loan ${loanToken} is funded`,
          alertId: 'TRUEFI-LOAN-FUNDED',
          protocol: 'truefi',
          severity: FindingSeverity.High,
          type: FindingType.Info,
          metadata: {
            loanToken,
            amount: formatedAmount,
          },
        }),
      ]);
    });

    it('returns a finding if there is a Reclaimed event', async () => {
      mockTxEvent.filterLog.mockReturnValueOnce([reclaimedEvent]);
      const findings = await handleTransaction(mockTxEvent);

      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: 'Reclaimed TrueFi loan',
          description: `Loan ${loanToken} is reclaimed`,
          alertId: 'TRUEFI-LOAN-RECLAIMED',
          protocol: 'truefi',
          severity: FindingSeverity.High,
          type: FindingType.Info,
          metadata: {
            loanToken,
            amount: formatedAmount,
          },
        }),
      ]);
    });
  });
});
