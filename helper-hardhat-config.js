const networkConfig = {
  default: {
    name: 'hardhat',
    keepersUpdateInterval: '30',
  },
  31337: {
    name: 'localhost',
    callbackGasLimit: '500000', // 500,000 gas
  },
  5: {
    name: 'mumbai',
    callbackGasLimit: '500000', // 500,000 gas
  },
  1: {
    name: 'polygon',
  },
};

const developmentChains = ['hardhat', 'localhost'];
const VERIFICATION_BLOCK_CONFIRMATIONS = 6;
// const frontEndContractsFile = '../nextjs-nft-marketplace-moralis-fcc/constants/networkMapping.json';
// const frontEndContractsFile2 =
//   '../nextjs-nft-marketplace-thegraph-fcc/constants/networkMapping.json';
// const frontEndAbiLocation = '../nextjs-nft-marketplace-moralis-fcc/constants/';
// const frontEndAbiLocation2 = '../nextjs-nft-marketplace-thegraph-fcc/constants/';

module.exports = {
  networkConfig,
  developmentChains,
  VERIFICATION_BLOCK_CONFIRMATIONS,
  // frontEndContractsFile,
  // frontEndContractsFile2,
  // frontEndAbiLocation,
  // frontEndAbiLocation2,
};
