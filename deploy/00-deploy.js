const { network, ethers } = require('hardhat');
const {
  developmentChains,
  VERIFICATION_BLOCK_CONFIRMATIONS,
  frontEndAbiLocation,
  frontEndContractsFile,
} = require('../helper-hardhat-config');
const { verify } = require('../utils/verify');
require('dotenv').config();
const fs = require('fs');

async function printUSDCBalances(ExampleERC20Contract, addresses) {
  for (const address of addresses) {
    const result = await ExampleERC20Contract.balanceOf(address);
    console.log(ethers.utils.formatUnits(result, 18));
  }
}

async function updateAbi() {
  const questionAndAnswer = await ethers.getContract('QuestionAndAnswer');
  fs.writeFileSync(
    `${frontEndAbiLocation}QuestionAndAnswer.json`,
    questionAndAnswer.interface.format(ethers.utils.FormatTypes.json)
  );

  if (process.env.UPDATE_EXAMPLE_ERC20_CONTRACT) {
    const exampleERC20 = await ethers.getContract('ExampleERC20');
    fs.writeFileSync(
      `${frontEndAbiLocation}ExampleERC20.json`,
      exampleERC20.interface.format(ethers.utils.FormatTypes.json)
    );
  }
}

async function updateContractAddresses() {
  const chainId = network.config.chainId.toString();
  const contractAddresses = JSON.parse(fs.readFileSync(frontEndContractsFile, 'utf8'));

  const questionAndAnswer = await ethers.getContract('QuestionAndAnswer');
  let exampleERC20;
  if (process.env.UPDATE_EXAMPLE_ERC20_CONTRACT) {
    exampleERC20 = await ethers.getContract('ExampleERC20');
  }

  if (chainId in contractAddresses) {
    if (!contractAddresses[chainId]['QuestionAndAnswer'].includes(questionAndAnswer.address)) {
      contractAddresses[chainId]['QuestionAndAnswer'].push(questionAndAnswer.address);
    }
    if (process.env.UPDATE_EXAMPLE_ERC20_CONTRACT) {
      if (!contractAddresses[chainId]['ExampleERC20'].includes(exampleERC20.address)) {
        contractAddresses[chainId]['ExampleERC20'].push(exampleERC20.address);
      }
    }
  } else {
    contractAddresses[chainId] = {
      QuestionAndAnswer: [questionAndAnswer.address],
    };
    if (process.env.UPDATE_EXAMPLE_ERC20_CONTRACT) {
      contractAddresses[chainId]['ExampleERC20'] = [exampleERC20.address];
    }
  }
  fs.writeFileSync(frontEndContractsFile, JSON.stringify(contractAddresses));
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

  /*
  const QuestionAndAnswerContract = await ethers.getContract('QuestionAndAnswer');
  const ExampleERC20Contract = await ethers.getContract('ExampleERC20');
  const player1Signer = await ethers.getSigner(player1);
  const player2Signer = await ethers.getSigner(player2);

  ////////////////////////////////////////////////////////////////////////////
  /////////// TESTING: answererToSettings(), askQuestion() ///////////////////
  ////////////////////////////////////////////////////////////////////////////

  await QuestionAndAnswerContract.connect(player1Signer).setAnswererSettings(
    ethers.utils.parseUnits('100'),
    'Crypto and Freedom!'
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
  await QuestionAndAnswerContract.connect(player2Signer).askQuestion(
    sampleQuestion,
    sampleAddress,
    sampleBounty
  );
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

  await QuestionAndAnswerContract.connect(player1Signer).answerQuestion(
    player2,
    0,
    'testing testing testing'
  );

  console.log(
    'Stored: ',
    await QuestionAndAnswerContract.connect(player2Signer).getQuestionerToAnswererToQAs(
      player2,
      sampleAddress,
      0
    )
  );

  console.log(
    'Stored: ',
    await QuestionAndAnswerContract.connect(player2Signer).getQuestionerToAnswererToQAs(
      player2,
      sampleAddress,
      1
    )
  );

  await printUSDCBalances(ExampleERC20Contract, [
    questionAndAnswer.address,
    deployer,
    player1,
    player2,
  ]);

  console.log(
    'Player 1: Can collect?: ',
    await QuestionAndAnswerContract.answererToSettings(player1)
  );

  await QuestionAndAnswerContract.connect(player1Signer).answererWithdraw();

  await printUSDCBalances(ExampleERC20Contract, [
    questionAndAnswer.address,
    deployer,
    player1,
    player2,
  ]);

  console.log(
    'Player 1: Can collect?: ',
    await QuestionAndAnswerContract.answererToSettings(player1)
  );
*/
  log('----------------------------------------------------');
  if (process.env.UPDATE_FRONT_END) {
    console.log('Writing to front end...');
    await updateContractAddresses();
    await updateAbi();
    console.log('Front end written!');
  }
  log('----------------------------------------------------');

  log('----------------------------------------------------');
  if (
    !developmentChains.includes(network.name) &&
    (process.env.ETHERSCAN_API_KEY || process.env.POLYGONSCAN_API_KEY)
  ) {
    log('Verifying the deployment...');
    await verify(questionAndAnswer.address, arguments);
    await verify(exampleERC20.address, arguments);
  }
  log('----------------------------------------------------');
};

module.exports.tags = ['all'];
