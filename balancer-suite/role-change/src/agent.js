const { Finding, FindingType, FindingSeverity } = require("forta-agent")
const { roles } = require("./agent-roles")

const BALANCER_AUTHORIZER = "0xa331d84ec860bf466b4cdccfb4ac09a1b43f3ae6"
const EVENT_ROLE_GRANTED = "event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender)"
const EVENT_ROLE_REVOKED = "event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender)"

function provideHandleTransaction() {
  return async function handleTransaction(txEvent) {
    const findings = []

    // Filter RoleGranted events
    const roleGrantedEventLog = txEvent.filterLog(EVENT_ROLE_GRANTED)
    for (const log of roleGrantedEventLog) {
      findings.push(createAlert(log, true))
    }

    // Filter RoleRevoked events
    const roleRevokedEventLog = txEvent.filterLog(EVENT_ROLE_REVOKED, BALANCER_AUTHORIZER)
    for (const log of roleRevokedEventLog) {
      findings.push(createAlert(log, false))
    }

    return findings
  }

  function createAlert(log, isGranted) {

    const { role, account, sender } = log.args
    
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
        sender
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
