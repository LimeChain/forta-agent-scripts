module.exports = {
    // Current unknown roles used on mainner:
    // 0xb5593fe09464f360ecf835d5b9319ce69900ae1b29d13844b73c250b1f5f92fb
    // 0x78ad1b68d148c070372f8643c4648efbb63c6a8a338f3c24714868e791367653
    // 0xc149e88b59429ded7f601ab52ecd62331cac006ae07c16543439ed138dcb8d34
    // 0x1282ab709b2b70070f829c46bc36f76b32ad4989fecb2fcb09a1b3ce00bbfc30
    // 0xc108e87eca9f3a0e9a9db0b708e6b15a70c3d0859b02723a7cc4b5ca1fb9fc28
    // 0x2f17310a7a479b437515eb1917c45a5f8d1fc7035462cfc7c7c43825dec621b5
    roles: {
        "0x0000000000000000000000000000000000000000000000000000000000000000": "defaultAdminRole",
      
        "0x3697d13ee45583cf9c2c64a978ab5886bcd07ec2b851efbea2fced982b8f9596": "setSwapFeePercentage", // Weighted Pool
        "0xc065d550fa98abc242b6baf98e7b2063590675f1ddd81bdb9ea8d8f5c5d52f98": "setSwapFeePercentage", // Weighted Pool 2
        "0x7b09f4b61ccfe85436161b0223489b187d9f9158c542b5e6105df147afc78aca": "setSwapFeePercentage", // Stable Pool
        "0xf472b63b0e5e0ef0eedf49fb6dcb108ff97950c4394d78409c9251ea89c943da": "setSwapFeePercentage", // Liquidity Bootstrapping Pool
        "0x15d3918ca8f9895d8906a780f5f402d32707bada7b1b5e7b21b7351257103a35": "setSwapFeePercentage", // Metastable Pool
        "0x72696c3624ff2400c3580f888cdfc372de1ec9ecba65f61ae7d06752d0181f3a": "setSwapFeePercentage", // Investment Pool
      
        "0x141952aa359b8d81b98c1f6e112b55aa1e7e484125b02babad7a3a28443ff571": "enableOracle", // Weighted Pool
        "0xe543cb443264aa0734939fa06d9e6ade81d691ee5f27c2183c2a54a2c245c8b1": "enableOracle", // Weighted Pool 2
        "0x2b38432229bb86eab67c4f255dbace310e90dfe18c3222ff6f2521c27c77cdc0": "enableOracle", // Stable Pool
        "0x0c3392f871bbb6000b619920797d08060a277f3f417802b0e26fa4acf668b329": "enableOracle", // Liquidity Bootstrapping Pool
        "0x9bb0ceafb44194dec6a47c23126dfed1662c42d573398f0f4af21aee3757b88e": "enableOracle", // Metastable Pool
        "0x1de807b30dcaf080daa7ef55be1e5fb46abb9e47f5c937ac67675ee38396b164": "enableOracle", // Investment Pool
      
        "0x3c7de1d8a207c7901ec612f9f0f50957da016911a50d5c22bbe5c9f4f3392d95": "setPaused", // Weighted Pool
        "0x43f20c0b0ba9191edc765615b4aa9f5fc68be74185b79f813946e7bc9a9e1e38": "setPaused", // Weighted Pool 2
        "0x97270598fa4177db8fa1b289b1a781d6ae7a6e1f87fe4c03f6a0c07990014bb8": "setPaused", // Stable Pool
        "0x0546471589e6cc8d242057938789941d762b4cf0186a74658ae0f81866138734": "setPaused", // Liquidity Bootstrapping Pool
        "0xa9d5a531fd849052f92ebf9cbe5ae801a82bbc0ffd854f4dcd44c663d4a11ec8": "setPaused", // Metastable Pool
        "0x39794bfb631976145dd5645f5c903aa2b443f72f15e99d1b7413294703d56380": "setPaused", // Investment Pool
      
        "0x760573a147db9991d2183086328a35ef1cf67a357cd1253745d8d7816487bb7d": "setAssetManagerPoolConfig", // Weighted Pool
        "0xda5039e558bd16a86b2f75995b3858bba0b4f96002f197a21bc715f8811b43e8": "setAssetManagerPoolConfig", // Weighted Pool 2
        "0xea0e8bf1029e5b454ac2c6b093313424d67ab260a57f5492f22eb3160dfbd03b": "setAssetManagerPoolConfig", // Stable Pool
        "0x64bd85d3cec012363fd864ef6d5f990205906fa3dc9b8627d9308c2918adc87c": "setAssetManagerPoolConfig", // Liquidity Bootstrapping Pool
        "0x47d8b45716302b6bb05e821fc6c86147c80f81072a7d45c4b18663b14c485782": "setAssetManagerPoolConfig", // Metastable Pool
        "0x70f1f15b539d34f7e9c108ea6bd9dfa7a6b325a97836e334a3631957789d15b4": "setAssetManagerPoolConfig", // Investment Pool
      
        "0x8c9b4c1f53b968f62f656d48126bd856c38b0d879974dff5b5d6055c0d2917d4": "startAmplificationParameterUpdate", // Stable Pool
        "0xc787be37f98a254065bf8678258de57ce53a2d6814c519063f3003dd9f92dfc3": "stopAmplificationParameterUpdate", // Stable Pool
      
        "0xc8cec43a5d5eea46edca69d90b740e59c583c81a2a8fc493bb9428e720af8bba": "setPriceRateCacheDuration", // Metastable Pool
      
        "0x63c0eaeb06b0089842f2fe3ea983921782387e90d36d385cc683ab874153113b": "updateWeightsGradually", // Investment Pool
        "0xed247a86444c9cf443af36272c50d1bcab8fd1645fd1115253bf79a06300ee0d": "updateWeightsGradually", // Stable Pool
      
        "0xd9628fe78fc2a5e864832482b704caf2b03cd52c227663a96aa302ac9bd2f15c": "withdrawCollectedManagementFees", // Investment Pool
      
        "0x7b8a1d293670124924a0f532213753b89db10bde737249d4540e9a03657d1aff": "swap", // Vault
        "0xeba777d811cd36c06d540d7ff2ed18ed042fd67bbf7c9afcf88c818c7ee6b498": "manageUserBalance" // Vault
      }
}