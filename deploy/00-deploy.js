const { network } = require('hardhat');
const { developmentChains, VERIFICATION_BLOCK_CONFIRMATIONS } = require('../helper-hardhat-config');
const { verify } = require('../utils/verify');

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const waitBlockConfirmations = developmentChains.includes(network.name)
    ? 1
    : VERIFICATION_BLOCK_CONFIRMATIONS;

  log('----------------------------------------------------');
  const arguments = [];
  const nftMarketplace = await deploy('QuestionAndAnswer', {
    from: deployer,
    args: arguments,
    log: true,
    waitConfirmations: waitBlockConfirmations,
  });

  let QuestionAndAnswerContract = await ethers.getContract('QuestionAndAnswer');
  console.log((await QuestionAndAnswerContract.test()).toString());
  // .askQuestion('hello', 0x0, 100)

  // Verify the deployment
  if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
    log('Verifying...');
    await verify(nftMarketplace.address, arguments);
  }
  log('----------------------------------------------------');
};

module.exports.tags = ['all'];
