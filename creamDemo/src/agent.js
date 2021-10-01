const { Finding, FindingType, FindingSeverity } = require("forta-agent")
const { contractAddress, eventSigs, countThreshold } = require("./agent-config.json")
const TransactionCounter = require("./transaction-counter")

// 60 seconds
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
        
        if (count > countThreshold) {
          findings.push(createAlert(from, eventSig, count))
        }
      })
    })

    function createAlert(from, eventSig, count) {
      return Finding.fromObject({
        name: "High Transaction Volume",
        description: `High ${getEventName(eventSig)} calls (${count}) from ${from}`,
        alertId: "CREAM_HIGH_VOLUME",
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
