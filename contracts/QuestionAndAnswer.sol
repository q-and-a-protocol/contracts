// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// TODO: error QuestionAndAnswer__QuestionTooLong();
error QuestionAndAnswer__BountyTooLow();
error QuestionAndAnswer__InvalidPriceMinimum();
error QuestionAndAnswer__AllowanceTooLow();
error QuestionAndAnswer__InvalidExpiry();
error QuestionAndAnswer__QuestionDoesNotExist();
error QuestionAndAnswer__QuestionAlreadyAnswered();
error QuestionAndAnswer__QuestionHasExpired();
error QuestionAndAnswer__CannotCancelQuestion();
error QuestionAndAnswer__NothingToWithdraw();

contract QuestionAndAnswer {
    event QuestionAsked(
        address indexed questioner,
        address indexed answerer,
        uint256 indexed questionId,
        uint256 bounty,
        uint256 date,
        string question,
        uint256 expiryDate
    );
    event QuestionAnswered(
        address indexed questioner,
        address indexed answerer,
        uint256 indexed questionId,
        uint256 bounty,
        uint256 date,
        string answer
    );
    event QuestionCanceled(
        address indexed questioner,
        address indexed answerer,
        uint256 indexed questionId,
        uint256 date
    );
    event Withdraw(address indexed withdrawalBy, uint256 indexed amount);

    // For now, this is the only accepted currency.
    address immutable i_USDC_ADDRESS;

    struct AnswererSettings {
        bool populated;
        uint256 priceMinimum;
        uint256 withdrawableAmount;
        string interests;
    }
    struct QuestionAnswerDetails {
        string question;
        string answer;
        bool answered;
        uint256 bounty;
        uint256 id;
        uint256 expiryDate;
    }
    mapping(address => AnswererSettings) public answererToSettings;
    mapping(address => mapping(address => QuestionAnswerDetails[]))
        private questionerToAnswererToQAs;

    constructor(address USDCAddress) {
        i_USDC_ADDRESS = USDCAddress;
    }

    function setAnswererSettings(
        uint256 priceMinimum,
        string calldata interests
    ) public {
        if (priceMinimum < 0) {
            revert QuestionAndAnswer__InvalidPriceMinimum();
        }

        answererToSettings[msg.sender].populated = true;
        answererToSettings[msg.sender].priceMinimum = priceMinimum;
        answererToSettings[msg.sender].interests = interests;
    }

    function askQuestion(
        string calldata question,
        address answerer,
        uint256 bounty,
        uint256 expiryDate
    ) public {
        AnswererSettings memory answererSettings = answererToSettings[answerer];

        if (
            answererSettings.populated && bounty < answererSettings.priceMinimum
        ) {
            revert QuestionAndAnswer__BountyTooLow();
        }

        IERC20 paymentTokenERC20 = IERC20(i_USDC_ADDRESS);
        if (paymentTokenERC20.allowance(msg.sender, address(this)) < bounty) {
            revert QuestionAndAnswer__AllowanceTooLow();
        }

        if (expiryDate <= block.timestamp) {
            revert QuestionAndAnswer__InvalidExpiry();
        }

        QuestionAnswerDetails[]
            memory questionAnswerDetails = questionerToAnswererToQAs[
                msg.sender
            ][answerer];
        QuestionAnswerDetails
            memory newQuestionAnswerDetails = QuestionAnswerDetails({
                question: question,
                answer: "",
                answered: false,
                bounty: bounty,
                id: 0,
                expiryDate: expiryDate
            });
        if (questionAnswerDetails.length != 0) {
            newQuestionAnswerDetails.id =
                questionAnswerDetails[questionAnswerDetails.length - 1].id +
                1;
        }
        questionerToAnswererToQAs[msg.sender][answerer].push(
            newQuestionAnswerDetails
        );

        emit QuestionAsked(
            msg.sender,
            answerer,
            newQuestionAnswerDetails.id,
            bounty,
            block.timestamp,
            question,
            expiryDate
        );
    }

    function answerQuestion(
        address questioner,
        uint256 questionId,
        string calldata answer
    ) public {
        QuestionAnswerDetails[]
            storage allQuestionAnswerDetails = questionerToAnswererToQAs[
                questioner
            ][msg.sender];
        if (allQuestionAnswerDetails.length <= questionId) {
            revert QuestionAndAnswer__QuestionDoesNotExist();
        }
        if (allQuestionAnswerDetails[questionId].answered) {
            revert QuestionAndAnswer__QuestionAlreadyAnswered();
        }
        if (
            allQuestionAnswerDetails[questionId].expiryDate <= block.timestamp
        ) {
            revert QuestionAndAnswer__QuestionHasExpired();
        }

        allQuestionAnswerDetails[questionId].answer = answer;
        allQuestionAnswerDetails[questionId].answered = true;
        uint256 bountyToCollect = allQuestionAnswerDetails[questionId].bounty;

        emit QuestionAnswered(
            questioner,
            msg.sender,
            questionId,
            bountyToCollect,
            block.timestamp,
            answer
        );

        IERC20 paymentTokenERC20 = IERC20(i_USDC_ADDRESS);
        paymentTokenERC20.transferFrom(
            questioner,
            address(this),
            bountyToCollect
        );

        answererToSettings[msg.sender].withdrawableAmount += bountyToCollect;
    }

    function cancelQuestion(address answerer, uint256 questionId) public {
        QuestionAnswerDetails[]
            storage allQuestionAnswerDetails = questionerToAnswererToQAs[
                msg.sender
            ][answerer];
        if (allQuestionAnswerDetails.length <= questionId) {
            revert QuestionAndAnswer__QuestionDoesNotExist();
        }
        if (allQuestionAnswerDetails[questionId].answered) {
            revert QuestionAndAnswer__QuestionAlreadyAnswered();
        }
        if (
            allQuestionAnswerDetails[questionId].expiryDate <= block.timestamp
        ) {
            revert QuestionAndAnswer__QuestionHasExpired();
        }
        if (
            allQuestionAnswerDetails[questionId].expiryDate <=
            block.timestamp + 5 minutes
        ) {
            revert QuestionAndAnswer__CannotCancelQuestion();
        }

        allQuestionAnswerDetails[questionId].expiryDate = block.timestamp - 1;

        emit QuestionCanceled(
            msg.sender,
            answerer,
            questionId,
            block.timestamp
        );
    }

    function answererWithdraw() public {
        AnswererSettings storage answererSettings = answererToSettings[
            msg.sender
        ];
        if (answererSettings.withdrawableAmount <= 0) {
            revert QuestionAndAnswer__NothingToWithdraw();
        }

        uint256 withdrawableAmount = answererSettings.withdrawableAmount;
        IERC20 paymentTokenERC20 = IERC20(i_USDC_ADDRESS);
        paymentTokenERC20.transfer(msg.sender, withdrawableAmount);

        answererSettings.withdrawableAmount = 0;

        emit Withdraw(msg.sender, withdrawableAmount);
    }

    function getQuestionerToAnswererToQAs(
        address questioner,
        address answerer,
        uint256 index
    )
        public
        view
        returns (
            string memory,
            string memory,
            bool,
            uint256,
            uint256,
            uint256
        )
    {
        return (
            questionerToAnswererToQAs[questioner][answerer][index].question,
            questionerToAnswererToQAs[questioner][answerer][index].answer,
            questionerToAnswererToQAs[questioner][answerer][index].answered,
            questionerToAnswererToQAs[questioner][answerer][index].bounty,
            questionerToAnswererToQAs[questioner][answerer][index].id,
            questionerToAnswererToQAs[questioner][answerer][index].expiryDate
        );
    }
}
