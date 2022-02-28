const { Finding, FindingSeverity, FindingType } = require("forta-agent")

const xsLockerAddress = "0x501ace47c5b0c2099c4464f681c3fa2ecd3146c1"

const withdrawMethodsSignatures = [
  "0x00f714ce", // withdraw
  "0xd6186627", // withdrawInPart
  "0x8d50b33d", // withdrawMany
]

const handleTransaction = async (txEvent) => {
  const findings = []

  const { from, to, gas, data } = txEvent.transaction
  const { status, gasUsed } = txEvent.receipt

  // Return if the transaction is not send to the xsLocker contract
  if (to !== xsLockerAddress) return findings

  // Return if the called method is not a withdraw
  const isWithdraw = withdrawMethodsSignatures.some(e => data.startsWith(e))
  if (!isWithdraw) return findings

  // Return if the transaction is successful
  if (status) return findings

  // Return if the reason for the revert is out of gas
  if (gas === gasUsed) return findings

  findings.push(Finding.fromObject({
    name: "xsLocker attempt to withdraw from a locked lock",
    description: `Address ${from} tried to withdraw from a locked lock`,
    alertId: "SOLACE-XS-LOCKER-REVERTED-WITHDRAW",
    protocol: "solace",
    severity: FindingSeverity.Medium,
    type: FindingType.Info,
    metadata: {
      from
    },
  }))

  return findings;
}

module.exports = {
  handleTransaction,
};
