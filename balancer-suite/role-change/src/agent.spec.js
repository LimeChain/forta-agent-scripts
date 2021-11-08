const {
  FindingType,
  FindingSeverity,
  Finding,
  createTransactionEvent,
} = require("forta-agent")

const { provideHandleTransaction } = require("./agent")

const authorizerAddress = "0xa331d84ec860bf466b4cdccfb4ac09a1b43f3ae6"
const fromAddress = "0x000000000000000000000000000000000000FFff"
const accountAddress = "0x000000000000000000000000000000000000aaaa"

const fromAddressEncoded    = "0x000000000000000000000000000000000000000000000000000000000000ffff"
const accountAddressEncoded = "0x000000000000000000000000000000000000000000000000000000000000aaaa"

const eventGrantedTopic = "0x2f8788117e7eff1d82e926ec794901d17c78024a50270940304540a733656f0d"
const eventRevokedTopic = "0xf6391f5c32d9c69d2a47ea670b442974b53935d1edc7fd64eb21e047a839171b"

const setSwapFeePercentageRole = "0xc065d550fa98abc242b6baf98e7b2063590675f1ddd81bdb9ea8d8f5c5d52f98"
const unknownRole = "0x78ad1b68d148c070372f8643c4648efbb63c6a8a338f3c24714868e791367653"

const logsMatchEventGranted = {
  address: authorizerAddress,
  topics: [
    eventGrantedTopic,
    setSwapFeePercentageRole,
    accountAddressEncoded,
    fromAddressEncoded
  ],
  data: "0x"
}
const logsMatchEventRevoked = {
  address: authorizerAddress,
  topics: [ 
    eventRevokedTopic,
    unknownRole,
    accountAddressEncoded,
    fromAddressEncoded
  ],
  data: "0x"
}
const logsNoMatchEvent = {
  address: authorizerAddress,
  topics: [ '0x0' ],
}

describe("role change agent", () => {
  let handleTransaction

  const createTxEvent = ({ logs, addresses }) =>
    createTransactionEvent({
      receipt: { logs },
      addresses,
      transaction: { fromAddress }
    })

  beforeAll(() => {
    handleTransaction = provideHandleTransaction()
  })

  describe("handleTransaction", () => {
    it("returns empty findings if no RoleGranted or RoleRevoked event", async () => {
      const txEvent = createTxEvent({
        logs: [logsNoMatchEvent],
        addresses: { [authorizerAddress]: true }
      })

      const findings = await handleTransaction(txEvent)

      expect(findings).toStrictEqual([])
    })

    it("returns a finding on RoleGranted event", async () => {
      const txEvent = createTxEvent({
        logs: [logsMatchEventGranted],
        addresses: { [authorizerAddress]: true }
      })

      const findings = await handleTransaction(txEvent)

      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: "Balancer role granted",
          description: `Role setSwapFeePercentage granted for ${accountAddress}`,
          alertId: "BALANCER-ROLE-CHANGE",
          protocol: "balancer",
          type: FindingType.Info,
          severity: FindingSeverity.Medium,
          metadata: {
            account: accountAddress,
            sender: fromAddress,
            role: setSwapFeePercentageRole,
            isGranted: true
          },
        }),
      ])
    })

    it("returns a finding on RoleRevoked event", async () => {
      const txEvent = createTxEvent({
        logs: [logsMatchEventRevoked],
        addresses: { [authorizerAddress]: true }
      })

      const findings = await handleTransaction(txEvent)

      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: "Balancer role revoked",
          description: `Role ${unknownRole} revoked for ${accountAddress}`,
          alertId: "BALANCER-ROLE-CHANGE",
          protocol: "balancer",
          type: FindingType.Info,
          severity: FindingSeverity.Medium,
          metadata: {
            account: accountAddress,
            sender: fromAddress,
            role: unknownRole,
            isGranted: false
          },
        }),
      ])
    })
  })
})
