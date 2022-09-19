// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "hardhat/console.sol";

// TODO: error QuestionAndAnswer__QuestionTooLong();
error QuestionAndAnswer__BountyTooLow();
error QuestionAndAnswer__InvalidPriceMinimum();

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

    struct AnswererSettings {
        bool populated;
        int256 priceMinimum;
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
        public questionerToAnswererToQAs;

    // TODO: function withdraw

    function askQuestion(
        string calldata question,
        address answerer,
        int256 bounty
    ) public {
        AnswererSettings memory answererSettings = answererToSettings[answerer];

        if (
            answererSettings.populated && bounty < answererSettings.priceMinimum
        ) {
            revert QuestionAndAnswer__BountyTooLow();
        }

        // APPROVED FOR CONTRACT TO TAKE MATIC?
    }

    // Priced in native currency (MATIC).
    function setAnswererSettings(int256 priceMinimum) public {
        if (priceMinimum <= 0) {
            revert QuestionAndAnswer__InvalidPriceMinimum();
        }

        AnswererSettings memory senderAnswererSettings = AnswererSettings({
            populated: true,
            priceMinimum: priceMinimum
        });
        answererToSettings[msg.sender] = senderAnswererSettings;
    }
}
