// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "hardhat/console.sol";

// TODO: error QuestionAndAnswer__QuestionTooLong();
error QuestionAndAnswer__BountyTooLow();

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
        uint256 priceMinimum;
        // uint256 questionCharacterLength;
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
        uint256 bounty
    ) public {
        AnswererSettings memory answererSettings = answererToSettings[answerer];
        console.log("Hello: ", answererSettings.priceMinimum);
        // bool(bounty < answererSettings.priceMinimum)
        // if (answererSettings) {
        //     revert QuestionAndAnswer__BountyTooLow();
        // }
    }

    function test() public pure returns (uint256) {
        return 1;
    }
}
