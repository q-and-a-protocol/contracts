const networkConfig = {
  default: {
    name: 'hardhat',
  },
  31337: {
    name: 'localhost',
  },
  5: {
    name: 'mumbai',
  },
  1: {
    name: 'polygon',
  },
};

const developmentChains = ['hardhat', 'localhost'];
const VERIFICATION_BLOCK_CONFIRMATIONS = 6;
const frontEndContractsFile = '../question-and-answer-front-end/src/constants/networkMapping.json';
const frontEndAbiLocation = '../question-and-answer-front-end/src/constants/';

module.exports = {
  networkConfig,
  developmentChains,
  VERIFICATION_BLOCK_CONFIRMATIONS,
  frontEndContractsFile,
  frontEndAbiLocation,
};
