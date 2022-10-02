const { network, deployments, ethers } = require('hardhat');
const { time, loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { anyValue } = require('@nomicfoundation/hardhat-chai-matchers/withArgs');
const { assert, expect } = require('chai');
const { developmentChains } = require('../helper-hardhat-config');

!developmentChains.includes(network.name)
  ? describe.skip
  : describe('QuestionAndAnswer', function () {
      // We use loadFixture to run this setup once, snapshot that state,
      // and reset Hardhat Network to that snapshot in every test.
      async function deployMainFixture() {
        // Contracts are deployed using the first signer/account by default
        const [deployer, player1, player2] = await ethers.getSigners();

        const QuestionAndAnswer = await ethers.getContractFactory('QuestionAndAnswer');
        const questionAndAnswer = await QuestionAndAnswer.deploy();

        const ExampleERC20 = await ethers.getContractFactory('ExampleERC20');
        const exampleERC20 = await ExampleERC20.deploy();

        return { questionAndAnswer, exampleERC20, deployer, player1, player2 };
      }
      describe('Deployment', function () {
        it('should have no settings for player1', async function () {
          const { questionAndAnswer, deployer, player1 } = await loadFixture(deployMainFixture);

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

      describe('Withdrawals', function () {
        describe('Validations', function () {});

        describe('Events', function () {});

        describe('Transfers', function () {});
      });
    });
