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
  const arguments1 = [];
  const exampleERC20 = await deploy('ExampleERC20', {
    from: deployer,
    args: arguments1,
    log: true,
    waitConfirmations: waitBlockConfirmations,
  });

  const arguments2 =
    network.name === 'mumbai'
      ? [0xd77cffca19aec21aca9f0e38743740efd548b2a4]
      : [exampleERC20.address];
  const questionAndAnswer = await deploy('QuestionAndAnswer', {
    from: deployer,
    args: arguments2,
    log: true,
    waitConfirmations: waitBlockConfirmations,
  });

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
