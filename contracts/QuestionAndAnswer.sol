// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// TODO: error QuestionAndAnswer__QuestionTooLong();
error QuestionAndAnswer__BountyTooLow();
error QuestionAndAnswer__InvalidPriceMinimum();
error QuestionAndAnswer__AllowanceTooLow();

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
        0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512;

    struct AnswererSettings {
        bool populated;
        uint256 priceMinimum;
        // TODO: uint256 questionCharacterLength;
        // TODO: acceptable categories
    }
    struct QuestionAnswerDetails {
        string question;
        string answer;
        uint256 id;
    }
    mapping(address => AnswererSettings) public answererToSettings;
    mapping(address => mapping(address => QuestionAnswerDetails[]))
        private questionerToAnswererToQAs;

    // TODO: function withdraw

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
                question: "",
                answer: "",
                id: 0
            });
        if (questionAnswerDetails.length == 0) {
            newQuestionAnswerDetails.question = question;
            newQuestionAnswerDetails.answer = "";
            newQuestionAnswerDetails.id = 1;

            questionerToAnswererToQAs[msg.sender][answerer].push(
                newQuestionAnswerDetails
            );
        }
        console.log(
            "length: ",
            questionerToAnswererToQAs[msg.sender][answerer].length
        );
    }

    // Priced in native currency (MATIC).
    function setAnswererSettings(uint256 priceMinimum) public {
        if (priceMinimum <= 0) {
            revert QuestionAndAnswer__InvalidPriceMinimum();
        }

        AnswererSettings memory senderAnswererSettings = AnswererSettings({
            populated: true,
            priceMinimum: priceMinimum
        });
        answererToSettings[msg.sender] = senderAnswererSettings;
    }

    function printQuestionerToAnswererToQAs(
        address questioner,
        address answerer,
        uint256 index
    ) public {
        console.log(
            "question: ",
            questionerToAnswererToQAs[questioner][answerer][index].question
        );
        console.log(
            "answer: ",
            questionerToAnswererToQAs[questioner][answerer][index].answer
        );
        console.log(
            "id: ",
            questionerToAnswererToQAs[questioner][answerer][index].id
        );
    }
}
