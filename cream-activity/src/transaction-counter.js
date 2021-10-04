const { eventSigs } = require("./agent-config.json")

// Map Structure:
// {
//  event1: {
//    0xaddr1: [
//      { hash1, time1 },
//      { hash2, time2 }
//    ]
//  },
//  event2: {
//    0xaddr1: [
//      { hash1, time1 },
//      { hash2, time2 }
//    ],
//    0xaddr2: [
//      { hash1, time1 },
//      { hash2, time2 }
//    ]
//  },
// }
module.exports = class TransactionCounter {
  constructor(timeInterval) {
    this.timeInterval = timeInterval
    this.transactionMap = {}

    // Initialize object for every event
    eventSigs.forEach((event) => {
      this.transactionMap[event] = {}
    })
  }

  increment(from, event, txHash, blockTimestamp) {
    // If transactions array does not exist, initialize it
    if (!this.transactionMap[event][from]) {
      this.transactionMap[event][from] = []
    }

    // Append transaction
    this.transactionMap[event][from].push({
      txHash,
      timestamp: blockTimestamp,
    })

    // Filter out any transactions that fall outside of the time interval
    this.transactionMap[event][from] = this.transactionMap[event][from].filter(
      (t) => t.timestamp >= blockTimestamp - this.timeInterval
    )

    return this.transactionMap[event][from].length
  }

  getTransactions(from, event) {
    return this.transactionMap[event][from]
      ? this.transactionMap[event][from].map((t) => t.txHash)
      : []
  }

  reset(from, event) {
    this.transactionMap[event][from] = []
  }
}
