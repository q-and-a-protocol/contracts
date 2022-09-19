const { network, ethers } = require('hardhat');
const { developmentChains, VERIFICATION_BLOCK_CONFIRMATIONS } = require('../helper-hardhat-config');
const { verify } = require('../utils/verify');

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer, player } = await getNamedAccounts();
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

  const QuestionAndAnswerContract = await ethers.getContract('QuestionAndAnswer');
  const playerSigner = await ethers.getSigner(player);

  setAnswererSettings;

  // const sampleQuestion = 'This is my question!';
  // const sampleAddress = ethers.utils.getAddress('0x8ba1f109551bd432803012645ac136ddd64dba72');
  // const sampleBounty = 5000;
  // await QuestionAndAnswerContract.connect(playerSigner).askQuestion(
  //   sampleQuestion,
  //   sampleAddress,
  //   sampleBounty
  // );

  log('----------------------------------------------------');
  // Verify the deployment
  if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
    log('Verifying...');
    await verify(nftMarketplace.address, arguments);
  }
  log('----------------------------------------------------');
};

module.exports.tags = ['all'];
