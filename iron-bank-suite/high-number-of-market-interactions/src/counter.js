module.exports = class Counter {
  constructor(timeInterval) {
    this.timeInterval = timeInterval
    this.interactions = {}
  }

  increment(address, action, txHash, timestamp) {
    // If interaction array does not exist, initialize it
    if (!this.interactions[address]) {
      this.interactions[address] = []
    }

    // Append interaction
    this.interactions[address].push({
      txHash,
      action,
      timestamp,
    })

    // Filter out any interactions that fall outside of the time interval
    this.interactions[address] = this.interactions[address].filter(
      (t) => t.timestamp >= timestamp - this.timeInterval
    )

    return this.interactions[address].length
  }

  getInteractions(address) {
    return this.interactions[address]
      ? this.interactions[address].map((t) => { 
        return { hash: t.txHash, action: t.action } 
      })
      : []
  }

  reset(address) {
    delete this.interactions[address]
  }
}
