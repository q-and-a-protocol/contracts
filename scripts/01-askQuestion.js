const { ethers, network } = require('hardhat');

async function askQuestion() {
  let QuestionAndAnswerContract = await ethers.getContract('QuestionAndAnswer');
  const askedTx = await QuestionAndAnswerContract.askQuestion();
  askedTx.wait(1);
  console.log('Question Asked!');
}

askQuestion()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
