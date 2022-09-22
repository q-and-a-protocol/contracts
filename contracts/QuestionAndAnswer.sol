// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// TODO: error QuestionAndAnswer__QuestionTooLong();
error QuestionAndAnswer__BountyTooLow();
error QuestionAndAnswer__InvalidPriceMinimum();
error QuestionAndAnswer__AllowanceTooLow();
error QuestionAndAnswer__QuestionDoesNotExist();
error QuestionAndAnswer__QuestionAlreadyAnswered();

contract QuestionAndAnswer {
    event QuestionAsked(
        address indexed questioner,
        address indexed answerer,
        uint256 indexed questionId,
        uint256 bounty
    );
    event QuestionAnswered(
        address indexed questioner,
        address indexed answerer,
        uint256 indexed questionId,
        uint256 bounty
    );
    event QuestionCanceled(
        address indexed questioner,
        address indexed answerer,
        uint256 indexed questionId
    );
    event QuestionExpired(
        address indexed questioner,
        address indexed answerer,
        uint256 indexed questionId
    );

    address constant PAYMENT_TOKEN_ADDRESS =
        0xd77cFfca19aec21aca9F0E38743740EfD548b2A4;

    struct AnswererSettings {
        bool populated;
        uint256 priceMinimum;
        uint256 withdrawableAmount;
        // TODO: uint256 questionCharacterLength;
        // TODO: acceptable categories
    }
    struct QuestionAnswerDetails {
        string question;
        string answer;
        bool answered;
        uint256 bounty;
        uint256 id;
    }
    mapping(address => AnswererSettings) public answererToSettings;
    mapping(address => mapping(address => QuestionAnswerDetails[]))
        private questionerToAnswererToQAs;

    // TODO: function withdraw

    function version() public pure returns (uint256) {
        return 1;
    }

    function askQuestion(
        string calldata question,
        address answerer,
        uint256 bounty
    ) public {
        AnswererSettings memory answererSettings = answererToSettings[answerer];

        if (
            answererSettings.populated && bounty < answererSettings.priceMinimum
        ) {
            revert QuestionAndAnswer__BountyTooLow();
        }

        IERC20 paymentTokenERC20 = IERC20(PAYMENT_TOKEN_ADDRESS);
        if (paymentTokenERC20.allowance(msg.sender, address(this)) < bounty) {
            revert QuestionAndAnswer__AllowanceTooLow();
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
                id: 0
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
            bounty
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
        allQuestionAnswerDetails[questionId].answer = answer;
        allQuestionAnswerDetails[questionId].answered = true;
        uint256 bountyToCollect = allQuestionAnswerDetails[questionId].bounty;

        emit QuestionAnswered(
            questioner,
            msg.sender,
            questionId,
            bountyToCollect
        );

        IERC20 paymentTokenERC20 = IERC20(PAYMENT_TOKEN_ADDRESS);
        paymentTokenERC20.transferFrom(
            questioner,
            address(this),
            bountyToCollect
        );

        answererToSettings[msg.sender].withdrawableAmount += bountyToCollect;
    }

    // Priced in native currency (MATIC).
    function setAnswererSettings(uint256 priceMinimum) public {
        if (priceMinimum <= 0) {
            revert QuestionAndAnswer__InvalidPriceMinimum();
        }

        AnswererSettings memory senderAnswererSettings = AnswererSettings({
            populated: true,
            priceMinimum: priceMinimum,
            withdrawableAmount: 0
        });
        answererToSettings[msg.sender] = senderAnswererSettings;
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
            uint256
        )
    {
        return (
            questionerToAnswererToQAs[questioner][answerer][index].question,
            questionerToAnswererToQAs[questioner][answerer][index].answer,
            questionerToAnswererToQAs[questioner][answerer][index].id
        );
    }
}
