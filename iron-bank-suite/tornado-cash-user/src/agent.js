const { Finding, FindingSeverity, FindingType } = require("forta-agent")
const axios = require("axios")
const { markets } = require("./iron-bank-markets")

const marketsAddresses = Object.values(markets)

const tornadoCashAddresses = [
  '0x12D66f87A04A9E220743712cE6d9bB1B5616B8Fc', // 0.1 ETH
  '0x47CE0C6eD5B0Ce3d3A51fdb1C52DC66a7c3c2936', // 1 ETH
  '0x910cbd523d972eb0a6f4cae4618ad62622b39dbf', // 10 ETH
  '0xA160cdAB225685dA1d56aa342Ad8841c3b53f291', // 100 ETH
]

// We cannot put the key in a config file
// because it would be easy to extract it
const apiKey = "test"

// 5 per minute * 60 minutes * 24 hours => ~1 day
const timeFrameBlocks = 5 * 60 * 24

function provideHandleTransaction(getEtherscanResponse) {
  return async function handleTransaction(txEvent) {
    const findings = []

    const hasIronBankInteraction = marketsAddresses.some(market => txEvent.addresses[market])
    if (!hasIronBankInteraction) return findings

    // Get the account's internal transactions from Etherscan for the last 1 day
    const response = await getEtherscanResponse(txEvent)
    const transactions = response.data.result

    const tornadoCashTransactions = transactions
      .filter(tx => tornadoCashAddresses.includes(tx.from))

    if (tornadoCashTransactions.length > 0) {
      findings.push(Finding.fromObject({
        name: "Account has used Tornado.cash",
        description: `Account has withdrawn from Tornado.cash pool`,
        alertId: "IRON-BANK-TORNADO-CASH-USER",
        protocol: "iron-bank",
        severity: FindingSeverity.Medium,
        type: FindingType.Suspicious,
        metadata: {
          account: txEvent.from,
          tornadoCashTxIds: tornadoCashTransactions.map(tx => tx.hash)
        },
      }))
    }

    return findings
  }
}

const getEtherscanResponse = async (txEvent) => {
  const query = getEtherscanQuery(txEvent)
  return axios.get(query)
}

const getEtherscanQuery = (txEvent) => {
  const startBlock = txEvent.blockNumber - timeFrameBlocks
  return `https://api.etherscan.io/api?module=account` +
    `&action=txlistinternal&address=${txEvent.from}&startblock=${startBlock}` +
    `&endblock=latest&page=1&offset=100&sort=desc&apikey=${apiKey}`
}

module.exports = {
  handleTransaction: provideHandleTransaction(getEtherscanResponse),
  provideHandleTransaction
}
