const { network, ethers } = require('hardhat');
const { developmentChains, VERIFICATION_BLOCK_CONFIRMATIONS } = require('../helper-hardhat-config');
const { verify } = require('../utils/verify');

async function printUSDCBalances(ExampleERC20Contract, addresses) {
  for (const address of addresses) {
    const result = await ExampleERC20Contract.balanceOf(address);
    console.log(ethers.utils.formatUnits(result));
  }
}

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer, player1, player2 } = await getNamedAccounts();
  const waitBlockConfirmations = developmentChains.includes(network.name)
    ? 1
    : VERIFICATION_BLOCK_CONFIRMATIONS;

  log('----------------------------------------------------');

  ////////////////////////////////////////////////////////////////////////////
  ///////////////////////// SET UP CONTRACT, SIGNERS /////////////////////////
  ////////////////////////////////////////////////////////////////////////////

  const arguments = [];
  const questionAndAnswer = await deploy('QuestionAndAnswer', {
    from: deployer,
    args: arguments,
    log: true,
    waitConfirmations: waitBlockConfirmations,
  });
  const exampleERC20 = await deploy('ExampleERC20', {
    from: deployer,
    args: arguments,
    log: true,
    waitConfirmations: waitBlockConfirmations,
  });

  const QuestionAndAnswerContract = await ethers.getContract('QuestionAndAnswer');
  const ExampleERC20Contract = await ethers.getContract('ExampleERC20');
  const player1Signer = await ethers.getSigner(player1);
  const player2Signer = await ethers.getSigner(player2);

  ////////////////////////////////////////////////////////////////////////////
  /////////// TESTING: answererToSettings(), askQuestion() ///////////////////
  ////////////////////////////////////////////////////////////////////////////

  await QuestionAndAnswerContract.connect(player1Signer).setAnswererSettings(
    ethers.utils.parseUnits('100')
  );

  const player1AnswererToSettings = await QuestionAndAnswerContract.connect(
    player1Signer
  ).answererToSettings(player1);
  console.log(`Updated player1AnswererToSettings to: ${player1AnswererToSettings}`);

  const sampleBounty = ethers.utils.parseUnits('100');
  await ExampleERC20Contract.connect(player2Signer).myMint();
  await ExampleERC20Contract.connect(player2Signer).approve(
    questionAndAnswer.address,
    sampleBounty
  );
  const sampleQuestion = 'This is my question!';
  const sampleAddress = player1;
  // const sampleBounty = ethers.utils.parseUnits('100');
  await QuestionAndAnswerContract.connect(player2Signer).askQuestion(
    sampleQuestion,
    sampleAddress,
    sampleBounty
  );

  await printUSDCBalances(ExampleERC20Contract, [
    questionAndAnswer.address,
    deployer,
    player1,
    player2,
  ]);

  log('----------------------------------------------------');
  // Verify the deployment
  if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
    log('Verifying...');
    await verify(questionAndAnswer.address, arguments);
  }
  log('----------------------------------------------------');
};

module.exports.tags = ['all'];
