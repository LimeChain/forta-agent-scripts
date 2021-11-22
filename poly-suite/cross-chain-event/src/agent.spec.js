const {
  FindingType,
  FindingSeverity,
  Finding,
} = require("forta-agent")

const { provideHandleBlock, provideInitialize } = require("./agent")

// Taken from tx 61e75a887420a59419d63a88c25323f7f5a51b11649e37114dba9791113e523a
const storageData = "203a523e119197ba4d11379e64111ba5f5f72353c2883ad61994a52074885ae7610" + 
  "20000000000000020000000000000000000000000000000000000000000000000000000000000a511" + 
  "20a2cb9bf3d6ab117b4ec8a6f4e30f021749dd7e39fc0e695516bb933329e98e0214250e76987d838" + 
  "a75310c34bf422ea9f1ac4cc9060600000000000000142f7ac9436ba4b548f9582af91ca1ef02cd2f" + 
  "1f0306756e6c6f636b4a14bc194e6f748a222754c3e8b9946922c09e7d4e9114625649fc7bfe6e63b" + 
  "181ac9a0bc3e84e895ec9c700f00e0e0417ba286e0400000000000000000000000000000000000000000000"

const events = [
  {
    'TxHash': '0xhash',
    'Notify': [
      {
        'ContractAddress': '0300000000000000000000000000000000000000',
        'States': [
          'makeProof', // method
          '2', // srcChainId
          '',
          '',
          '',
          'key',
        ]
      }
    ]
  }
]

describe("cross chain event agent", () => {
  const clientMock = {
    request: jest.fn()
  }
  const contractsMock = {
    '2': {
      getEthTxHash: jest.fn()
    }
  }

  describe("handleBlock", () => {
    it("returns a finding", async () => {
      const initialize = provideInitialize(clientMock)
      const handleBlock = provideHandleBlock(clientMock, contractsMock)

      clientMock.request.mockReturnValueOnce(2) // getblockcount in initialize
      clientMock.request.mockReturnValueOnce(3) // getblockcount in handleBlock
      clientMock.request.mockReturnValueOnce(events) // getsmartcodeevent
      clientMock.request.mockReturnValueOnce(storageData) // getstorage
      contractsMock['2'].getEthTxHash.mockReturnValueOnce("0xwronghash")

      await initialize()
      const findings = await handleBlock()

      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: "Poly Cross Chain Event With Wrong Parameters",
          description: `The parameters of the CrossChainEvent and the poly storage are different`,
          alertId: "POLY-CROSS-CHAIN-EVENT-WRONG-PARAMS",
          protocol: "poly",
          type: FindingType.Exploit,
          severity: FindingSeverity.Critical,
          metadata: {
            txHash: events[0]['TxHash'],
            storageHash: '0x8a55c5fb3fad711b6401c3bdf1874bfb322e60178895baa6c8ff4ae62bfc30ae',
            srcChainHash: '0xwronghash'
          },
        }),
      ])
    })
    
    it("shound not return a finding if the data is correct", async () => {
      const initialize = provideInitialize(clientMock)
      const handleBlock = provideHandleBlock(clientMock, contractsMock)

      clientMock.request.mockReturnValueOnce(2) // getblockcount in initialize
      clientMock.request.mockReturnValueOnce(3) // getblockcount in handleBlock
      clientMock.request.mockReturnValueOnce(events) // getsmartcodeevent
      clientMock.request.mockReturnValueOnce(storageData) // getstorage
      contractsMock['2'].getEthTxHash.mockReturnValueOnce("0x8a55c5fb3fad711b6401c3bdf1874bfb322e60178895baa6c8ff4ae62bfc30ae")

      await initialize()
      const findings = await handleBlock()

      expect(findings).toStrictEqual([])
    })
  })
})
