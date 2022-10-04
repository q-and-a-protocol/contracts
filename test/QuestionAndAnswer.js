const { network, ethers } = require('hardhat');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { expect } = require('chai');
const { developmentChains } = require('../helper-hardhat-config');

// TODO:
// fix tests
// add test with valid expiry
// add test with invalid expiry
// add test answer in time
// add test answer when out of time

!developmentChains.includes(network.name)
  ? describe.skip
  : describe('QuestionAndAnswer', function () {
      // We use loadFixture to run this setup once, snapshot that state,
      // and reset Hardhat Network to that snapshot in every test.
      async function deployMainFixture() {
        // Contracts are deployed using the first signer/account by default
        const [deployer, player1, player2] = await ethers.getSigners();

        const ExampleERC20 = await ethers.getContractFactory('ExampleERC20');
        const exampleERC20 = await ExampleERC20.deploy();

        const QuestionAndAnswer = await ethers.getContractFactory('QuestionAndAnswer');
        const questionAndAnswer = await QuestionAndAnswer.deploy(exampleERC20.address);

        return { questionAndAnswer, exampleERC20, deployer, player1, player2 };
      }

      describe('Settings', function () {
        it('should have no settings for player1', async function () {
          const { questionAndAnswer, player1 } = await loadFixture(deployMainFixture);

          const player1SettingsBefore = await questionAndAnswer.answererToSettings(player1.address);

          expect(player1SettingsBefore.priceMinimum).to.equal(0);
          expect(player1SettingsBefore.interests).to.equal('');

          const setPriceMinimumTo = ethers.utils.parseUnits('100');
          const setInterestsTo = 'Crypto and Freedom!';
          await questionAndAnswer
            .connect(player1)
            .setAnswererSettings(setPriceMinimumTo, setInterestsTo);

          const player1SettingsAfter = await questionAndAnswer.answererToSettings(player1.address);

          expect(player1SettingsAfter.priceMinimum).to.equal(setPriceMinimumTo);
          expect(player1SettingsAfter.interests).to.equal(setInterestsTo);
        });
      });

      describe('Use Cases', function () {
        it('is possible to ask multiple questions', async function () {
          const { questionAndAnswer, exampleERC20, player1, player2 } = await loadFixture(
            deployMainFixture
          );

          const bounty = ethers.utils.parseUnits('100');
          const question1 = 'Hi, how are you?';
          const question2 = 'How is the weather there?';
          const asker = player2;
          const answerer = player1;
          const date = new Date();
          date.setHours(date.getHours() + 4);
          const validExpiryDate = Math.floor(date.getTime() / 1000);

          const mintedAmount = ethers.utils.parseUnits('100');
          await exampleERC20.connect(asker).myMint();
          await exampleERC20.connect(asker).approve(questionAndAnswer.address, bounty);

          expect(await exampleERC20.allowance(asker.address, questionAndAnswer.address)).to.equal(
            mintedAmount
          );

          await questionAndAnswer
            .connect(asker)
            .askQuestion(question1, answerer.address, bounty, validExpiryDate);
          await questionAndAnswer
            .connect(asker)
            .askQuestion(question2, answerer.address, bounty, validExpiryDate);

          expect(
            (
              await questionAndAnswer.getQuestionerToAnswererToQAs(
                asker.address,
                answerer.address,
                0
              )
            )[0]
          ).to.equal(question1);

          expect(
            (
              await questionAndAnswer.getQuestionerToAnswererToQAs(
                asker.address,
                answerer.address,
                1
              )
            )[0]
          ).to.equal(question2);
        });

        it('should be possible to answer questions', async function () {
          const { questionAndAnswer, exampleERC20, player1, player2 } = await loadFixture(
            deployMainFixture
          );

          const bounty = ethers.utils.parseUnits('100');
          const question = 'Hi, how are you?';
          const answer = 'Good! And you?';
          const asker = player2;
          const answerer = player1;

          const mintedAmount = ethers.utils.parseUnits('100');
          await exampleERC20.connect(asker).myMint();
          await exampleERC20.connect(asker).approve(questionAndAnswer.address, bounty);

          await questionAndAnswer.connect(asker).askQuestion(question, answerer.address, bounty);

          // Testing "answered" property
          expect(
            (
              await questionAndAnswer.getQuestionerToAnswererToQAs(
                asker.address,
                answerer.address,
                0
              )
            )[1]
          ).to.not.equal(answer);
          expect(
            (
              await questionAndAnswer.getQuestionerToAnswererToQAs(
                asker.address,
                answerer.address,
                0
              )
            )[2]
          ).to.not.equal(true);

          await questionAndAnswer.connect(answerer).answerQuestion(asker.address, 0, answer);

          expect(
            (
              await questionAndAnswer.getQuestionerToAnswererToQAs(
                asker.address,
                answerer.address,
                0
              )
            )[1]
          ).to.equal(answer);

          expect(
            (
              await questionAndAnswer.getQuestionerToAnswererToQAs(
                asker.address,
                answerer.address,
                0
              )
            )[2]
          ).to.equal(true);
        });

        it('should be possible to see earnings and withdraw them', async function () {
          const { questionAndAnswer, exampleERC20, player1, player2 } = await loadFixture(
            deployMainFixture
          );

          const bounty = ethers.utils.parseUnits('100');
          const question = 'Hi, how are you?';
          const answer = 'Good! And you?';
          const asker = player2;
          const answerer = player1;

          const mintedAmount = ethers.utils.parseUnits('100');
          await exampleERC20.connect(asker).myMint();
          await exampleERC20.connect(asker).approve(questionAndAnswer.address, bounty);

          await questionAndAnswer.connect(asker).askQuestion(question, answerer.address, bounty);

          expect(await exampleERC20.balanceOf(questionAndAnswer.address)).to.equal(0);
          expect(await exampleERC20.balanceOf(asker.address)).to.equal(mintedAmount);
          expect(await exampleERC20.balanceOf(answerer.address)).to.equal(0);

          expect(
            (await questionAndAnswer.answererToSettings(answerer.address)).withdrawableAmount
          ).to.equal(0);

          await questionAndAnswer.connect(answerer).answerQuestion(asker.address, 0, answer);

          expect(await exampleERC20.balanceOf(questionAndAnswer.address)).to.equal(bounty);
          expect(await exampleERC20.balanceOf(asker.address)).to.equal(0);
          expect(await exampleERC20.balanceOf(answerer.address)).to.equal(0);

          expect(
            (await questionAndAnswer.answererToSettings(answerer.address)).withdrawableAmount
          ).to.equal(bounty);

          await questionAndAnswer.connect(answerer).answererWithdraw();

          expect(await exampleERC20.balanceOf(questionAndAnswer.address)).to.equal(0);
          expect(await exampleERC20.balanceOf(asker.address)).to.equal(0);
          expect(await exampleERC20.balanceOf(answerer.address)).to.equal(bounty);
        });
      });

      // describe('Withdrawals', function () {
      //   describe('Validations', function () {});

      //   describe('Events', function () {});

      //   describe('Transfers', function () {});
      // });
    });
