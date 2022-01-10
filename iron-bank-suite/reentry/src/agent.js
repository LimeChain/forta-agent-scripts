const { Finding, FindingSeverity, FindingType } = require("forta-agent")
const { markets } = require("./iron-bank-markets")

const marketsAddresses = Object.values(markets)

async function handleTransaction(txEvent) {
  const findings = []

  // Filter only the traces that are borrow calls to an Iron Bank market
  const traces = txEvent.traces
    .filter(trace => trace.action.input.startsWith("0xc5ebeaec") 
      && marketsAddresses.includes(trace.action.to))

  // The root borrow event
  // If we detect a nested borrow we fire an alert
  let rootTrace
  for (const trace of traces) {
    // if the root is not set or the current trace has <= traceAddress change the root
    if (!rootTrace || trace.traceAddress.length <= rootTrace.traceAddress.length) {
      rootTrace = trace
    } else {
      // Check if the current traceAddress contains the root traceAddress
      // If so, than the borrows are nested
      const rootTraceAddress = rootTrace.traceAddress.join(',')
      const currentTraceAddress = trace.traceAddress.join(',')
      
      if (currentTraceAddress.startsWith(rootTraceAddress)) {
        findings.push(createAlert())
        break;
      }
    }
  }

  return findings
}

const createAlert = () => {
  return Finding.fromObject({
    name: "Borrow reentry",
    description: `Nested borrows`,
    alertId: "IRON-BANK-REENTRY",
    protocol: "iron-bank",
    severity: FindingSeverity.Critical,
    type: FindingType.Exploit,
  })
}

module.exports = {
  handleTransaction
}
