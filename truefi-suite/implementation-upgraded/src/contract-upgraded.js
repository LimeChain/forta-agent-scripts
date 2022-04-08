const { Finding, FindingSeverity, FindingType } = require('forta-agent');

const upgradedEvent = 'event Upgraded(address indexed implementation)';

const contracts = {
  '0xa606dd423df7dfb65efe14ab66f5fdebf62ff583': 'Lender',
  '0x1391d9223e08845e536157995085fe0cef8bd393': 'Pool Factory',
  '0x1ea63189eb1f4c109b10cf6567f328c826aa6151': 'SAFU',
  '0x69d844fb5928d0e7bc530cc6325a88e53d6685bc': 'Loan Factory',
};
const contractAddresses = Object.keys(contracts);

function createAlert(contract, address, newImplementation) {
  return Finding.fromObject({
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
  });
}

async function handleTransaction(txEvent) {
  const findings = [];

  const events = txEvent.filterLog(upgradedEvent, contractAddresses);

  events.forEach((event) => {
    const { implementation } = event.args;
    const contract = contracts[event.address];

    findings.push(createAlert(contract, event.address, implementation));
  });

  return findings;
}

module.exports = {
  handleTransaction,
};
