const { Finding, FindingType, FindingSeverity } = require("forta-agent")
const { roles } = require("./agent-roles")

const BALANCER_AUTHORIZER = "0xa331d84ec860bf466b4cdccfb4ac09a1b43f3ae6"
const EVENT_ROLE_GRANTED = "RoleGranted(bytes32,address,address)"
const EVENT_ROLE_REVOKED = "RoleRevoked(bytes32,address,address)"

function provideHandleTransaction() {
  return async function handleTransaction(txEvent) {
    const findings = []

    // Filter RoleGranted events
    const roleGrantedEventLog = txEvent.filterEvent(EVENT_ROLE_GRANTED, BALANCER_AUTHORIZER)
    for (const log of roleGrantedEventLog) {
      findings.push(createAlert(log, true))
    }

    // Filter RoleRevoked events
    const roleRevokedEventLog = txEvent.filterEvent(EVENT_ROLE_REVOKED, BALANCER_AUTHORIZER)
    for (const log of roleRevokedEventLog) {
      findings.push(createAlert(log, false))
    }

    return findings
  }

  function createAlert(log, isGranted) {
    const role = log.topics[1]

    // The account and the from address are extended to bytes32. We need to remove the 24 leading zeroes
    const account = "0x" + log.topics[2].substr(26)
    const from = "0x" + log.topics[3].substr(26)
    
    const status = isGranted ? "granted" : "revoked"

    return Finding.fromObject({
      name: `Balancer role ${status}`,
      description: `Role ${getRoleName(role)} ${status} for ${account}`,
      alertId: "BALANCER-ROLE-CHANGE",
      protocol: "balancer",
      severity: FindingSeverity.Medium,
      type: FindingType.Info,
      metadata: {
        role,
        account,
        isGranted,
        from
      },
    })
  }

  function getRoleName(role) {
    return roles[role] || role
  }
}

module.exports = {
  provideHandleTransaction,
  handleTransaction: provideHandleTransaction(),
}
