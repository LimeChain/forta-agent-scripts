const { ethers, getEthersProvider } = require("forta-agent");
const { Contract, Provider } = require("ethers-multicall");

const controllerAddress: string = "0xab1c342c7bf5ec5f02adea1c2270670bca144cbb";
const controllerAbi: string[] = [
  "function getAllMarkets() public view returns (address[] memory)",
];

const ethcallProvider = new Provider(getEthersProvider(), 1);

module.exports = {
  getMarkets: async (): Promise<any> => {
    const tokenAbi: string[] = [
      "function symbol() external view returns (string memory)",
      "function underlying() public view returns (address)",
      "function decimals() external view returns (uint8)",
    ];

    const contract = new ethers.Contract(
      controllerAddress,
      controllerAbi,
      getEthersProvider()
    );

    const marketsAddresses: string[] = (await contract.getAllMarkets()).map(
      (address: string) => address.toLowerCase()
    );

    let calls = marketsAddresses.map((address: string) => {
      const tokenContract = new Contract(address, tokenAbi);
      return tokenContract.symbol();
    });

    const symbols = await ethcallProvider.all(calls);

    calls = marketsAddresses.map((address: string) => {
      const tokenContract = new Contract(address, tokenAbi);
      return tokenContract.underlying();
    });

    const underlyingAddress = await ethcallProvider.all(calls);

    calls = underlyingAddress.map((address: string) => {
      const tokenContract = new Contract(address, tokenAbi);
      return tokenContract.decimals();
    });

    const decimals = await ethcallProvider.all(calls);
    const markets: { [key: string]: any } = {};
    marketsAddresses.forEach((market: string, i: number) => {
      markets[market] = { name: symbols[i], decimalsUnderlying: decimals[i] };
    });

    return markets;
  },

  getProvider: () => {
    return ethcallProvider;
  },
};
