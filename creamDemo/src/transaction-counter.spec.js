const TransactionCounter = require("./transaction-counter")

const borrowEvent = "Borrow(address,uint256,uint256,uint256)"
const address = "0xaddr"
const txHash = "0xtx"
let txCounter

describe("transaction counter", () => {
  beforeEach(() => {
    txCounter = new TransactionCounter(60)
  })
  it("should return 0 for new addresses", async () => {
    expect(txCounter.getTransactions(address, borrowEvent)).toStrictEqual([])
  })
  it("should return 1 after increment on new address", async () => {
    const count = txCounter.increment(address, borrowEvent, txHash, 100)

    expect(count).toStrictEqual(1)
    expect(txCounter.getTransactions(address, borrowEvent)).toStrictEqual([txHash])
  })
  it("should return 2 after 2 increments", async () => {
    txCounter.increment(address, borrowEvent, txHash, 100)
    const count = txCounter.increment(address, borrowEvent, txHash, 120)

    expect(count).toStrictEqual(2)
    expect(txCounter.getTransactions(address, borrowEvent)).toStrictEqual([txHash, txHash])
  })
  it("should remove old entries", async () => {
    // 4 transactions: 100, 120, 140, 160
    for (i = 100; i <= 160; i += 20) {
      txCounter.increment(address, borrowEvent, txHash+i, i)
    }
    expect(txCounter.getTransactions(address, borrowEvent).length).toStrictEqual(4)

    const count = txCounter.increment(address, borrowEvent, txHash+170, 170)

    // Count should be 4 because the first tx is removed (100 < 170 - 60)
    expect(count).toStrictEqual(4)

    expect(txCounter.getTransactions(address, borrowEvent)).toStrictEqual(
      [txHash+120, txHash+140, txHash+160, txHash+170]
    )
  })
})
