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
error QuestionAndAnswer__NothingToWithdraw();

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

    event Withdraw(address indexed withdrawalBy, uint256 indexed amount);

    address constant PAYMENT_TOKEN_ADDRESS =
        0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512;
    // hardhat: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
    // mumbai: 0xd77cFfca19aec21aca9F0E38743740EfD548b2A4

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

    function setAnswererSettingsPriceMinimum(uint256 priceMinimum) public {
        if (priceMinimum <= 0) {
            revert QuestionAndAnswer__InvalidPriceMinimum();
        }

        answererToSettings[msg.sender].populated = true;
        answererToSettings[msg.sender].priceMinimum = priceMinimum;
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

    function answererWithdraw() public {
        AnswererSettings storage answererSettings = answererToSettings[
            msg.sender
        ];
        if (answererSettings.withdrawableAmount <= 0) {
            revert QuestionAndAnswer__NothingToWithdraw();
        }

        uint256 withdrawableAmount = answererSettings.withdrawableAmount;
        IERC20 paymentTokenERC20 = IERC20(PAYMENT_TOKEN_ADDRESS);
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
            uint256
        )
    {
        return (
            questionerToAnswererToQAs[questioner][answerer][index].question,
            questionerToAnswererToQAs[questioner][answerer][index].answer,
            questionerToAnswererToQAs[questioner][answerer][index].answered,
            questionerToAnswererToQAs[questioner][answerer][index].bounty,
            questionerToAnswererToQAs[questioner][answerer][index].id
        );
    }
}
