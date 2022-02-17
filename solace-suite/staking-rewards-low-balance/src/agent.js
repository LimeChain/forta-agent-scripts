const { Finding, FindingSeverity, FindingType, ethers, getEthersProvider } = require("forta-agent");
const { Contract, Provider } = require("ethers-multicall")

const stakingRewardsAddress = "0x501ace3D42f9c8723B108D4fBE29989060a91411"
const stakingRewardsAbi = [ "function rewardPerSecond() view returns (uint256)" ]
const stakingRewarsContract = new Contract(stakingRewardsAddress, stakingRewardsAbi)

const solaceAddress = "0x501ace9c35e60f03a2af4d484f49f9b1efde9f40"
const solaceAbi = [ "function balanceOf(address account) external view returns (uint256)"]
const solaceContract = new Contract(solaceAddress, solaceAbi)

const SECONDS_TO_YEARS = 60 * 60 * 24 * 365
const PERCENTAGE_THRESHOLD = 20

let ethcallProvider

function provideInitialize(getProvider) {
  return async function initialize() {
    ethcallProvider = await getProvider()
  }
}

const handleBlock = async (blockEvent) => {
  const findings = [];

  // Check prices every 100 blocks (~20 minutes)
  // if (blockEvent.blockNumber % 100 !== 0 ) return findings

  const stakingRewardsCall = stakingRewarsContract.rewardPerSecond()
  const solaceCall = solaceContract.balanceOf(stakingRewardsAddress)

  const [ rewardPerSecond, balance ] = await ethcallProvider.all([stakingRewardsCall, solaceCall])

  const rewardPerYear = rewardPerSecond.mul(SECONDS_TO_YEARS)
  const percentage = balance.mul(100).div(rewardPerYear).toNumber()
  
  if (percentage < PERCENTAGE_THRESHOLD) {
    findings.push(Finding.fromObject({
      name: "Staking rewards contract has low Solace balance",
      description: `The Solace balance of the Staking rewards contract is ` + 
          `less than ${PERCENTAGE_THRESHOLD}% of the reward per year`,
      alertId: "SOLACE-STAKING-REWARDS-LOW-BALANCE",
      protocol: "solace",
      severity: FindingSeverity.High,
      type: FindingType.Info,
      metadata: {
        percentage
      },
    }))
  }

  return findings;
};

const getProvider = async () => {
  const provider = new Provider(getEthersProvider())
  await provider.init()
  return provider
}

module.exports = {
  provideInitialize,
  initialize: provideInitialize(getProvider),
  handleBlock,
};
