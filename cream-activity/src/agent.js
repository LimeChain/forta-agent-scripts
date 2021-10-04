const { Finding, FindingType, FindingSeverity } = require("forta-agent")
const { contractAddress, eventSigs, countThreshold } = require("./agent-config.json")
const TransactionCounter = require("./transaction-counter")

// Count only transactions in the last 60 seconds
const txCounter = new TransactionCounter(60)

function provideHandleTransaction(txCounter) {
  return async function handleTransaction(txEvent) {
    const findings = []
    const { from, hash: txHash } = txEvent.transaction
    const blockTimestamp = txEvent.timestamp

    // Iterate every event signature (Borrow, Mint and Redeem)
    eventSigs.forEach((eventSig) => {
      const eventLog = txEvent.filterEvent(eventSig, contractAddress)

      eventLog.forEach(() => {
        const count = txCounter.increment(from, eventSig, txHash, blockTimestamp)
        
        if (count === countThreshold) {
          findings.push(createAlert(from, eventSig, count))
          txCounter.reset(from, eventSig)
        }
      })
    })

    function createAlert(from, eventSig, count) {
      return Finding.fromObject({
        name: "High Transaction Activity",
        description: `${from} did ${getEventName(eventSig)} 5 times in the last minute`,
        alertId: "cream-v1-eth-activity",
        severity: FindingSeverity.Medium,
        type: FindingType.Suspicious,
        metadata: {
          from,
          transactions: JSON.stringify(txCounter.getTransactions(from, eventSig)),
        },
      })
    }

    return findings
  }
}

const getEventName = (eventSig) => {
  return eventSig.split("(")[0]
}

module.exports = {
  provideHandleTransaction,
  handleTransaction: provideHandleTransaction(txCounter),
}
