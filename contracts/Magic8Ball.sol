pragma solidity ^0.4.24;

import "./zeppelin/ERC20.sol";
import "./zeppelin/Pausable.sol";


/**
 * Simple contract for asking and answering questions, in exchange for ERC20 tokens.
 * @author Austen Greene
 */
contract Magic8Ball is Pausable {

    struct Question {
        uint256 id;
        address asker;
        address tokenContract;
        uint256 bountyAmount;
        string content;
        bool alreadyAnswered;
        string answer;
    }

    event LogQuestionAsked(
        uint256 questionId,
        address indexed asker,
        string content,
        uint256 bountyAmount,
        address indexed tokenContract
    );

    event LogQuestionAnswered(
        uint256 indexed questionId,
        address indexed oracle,
        string answer
    );

    // map of questionId => Question data
    mapping (uint256 => Question) questions;

    // For every user, the mapping of what questions they are allowed to answer
    // To check if user A can answer question 3, check if oracleAllowedQuestions[A][3] == true;
    mapping (address => mapping (uint256 => bool)) oracleAllowedQuestions;

    //Helps us keep track of how many questions have been asked so far
    uint256 public nextQuestionId;

    constructor() public {
        nextQuestionId = 0;
    }

    /**
     * @dev Throws if called by any account other than the one who asked the question.
     */
    modifier onlyQuestionAsker(uint256 questionId) {
        require(msg.sender == questions[questionId].asker);
        _;
    }

    /**
     * @dev Throws if the question has already been answered
     */
    modifier onlyActiveQuestion(uint256 questionId) {
        require(!questions[questionId].alreadyAnswered);
        _;
    }


    /**
    * @dev Allows anyone to pay a bounty amount of their choosing (in the form of an ERC20 token of their choosing)
    * to ask a question, and set a list of addresses who can respond to answer the question. Before calling this
    * method the asker must have approved a token transfer of the bountyAmount with their specified ERC20 token
    * contract, otherwise the transaction will fail.
    * @param tokenContract Address of the token that will be used to pay the bounty
    * @param bountyAmount Amount of the token that will be paid out to the oracle
    * @param question The question to be answered
    * @param oracles list of addresses that are allowed to answer the question
    *
    */
    function askQuestion(address tokenContract, uint256 bountyAmount, string question, address[] oracles) public
    whenNotPaused()
    returns (uint256 questionId) {
        questionId = nextQuestionId;
        nextQuestionId++;

        questions[questionId] = Question(questionId, msg.sender, tokenContract, bountyAmount, question, false, '');

        assignOracles(questionId, oracles);

        emit LogQuestionAsked(questionId, msg.sender, question, bountyAmount, tokenContract);

        //Warning Untrusted contract call!
        ERC20 untrustedToken = ERC20(tokenContract);

        bool success = untrustedToken.transferFrom(msg.sender, this, bountyAmount);
        require(success);
    }


    /**
    * @dev Allows the asker of a question to approve additional users to answer their question.  Can only be used by
    * the question asker of the specified question ID, will throw an exception for anyone else.
    * @param questionId Id of the question that the provided oracles will be allowed to answer
    * @param oracles list of addresses that are allowed to answer the question
    */
    function assignOracles(uint256 questionId, address[] oracles) public
    onlyQuestionAsker(questionId)
    onlyActiveQuestion(questionId)
    whenNotPaused()
    {
        // Warning: unbounded loop ... transaction may run out of gas and fail if the provided
        // list of allowed oracles is huge.
        // To get around this limitation askers can initially create the question with a smaller list,
        // and then call assignOracles multiple times to add the rest of the approved oracles later.
        for(uint i = 0 ; i < oracles.length ; i++) {
            oracleAllowedQuestions[oracles[i]][questionId] = true;
        }
    }

    /**
    * @dev Allows the asker of a question to remove users from the list of 'allowed oracles' that can answer their
    * question.  Can only be used by the question asker of the specified question ID, will throw an exception for
    * anyone else.
    * @param questionId Id of the question that the provided oracles will no longer be allowed to answer
    * @param oracles list of addresses that are no longer allowed to answer the question
    */
    function removeOracles(uint256 questionId, address[] oracles) public
    onlyQuestionAsker(questionId)
    onlyActiveQuestion(questionId)
    whenNotPaused()
    {
        for(uint i = 0 ; i < oracles.length ; i++) {
            oracleAllowedQuestions[oracles[i]][questionId] = false;
        }
    }

    /**
    * @dev Allows an approved oracle to answer a question.  They will be paid out in the token provided
    * by the question asker
    * @param questionId ID of the question to be answered
    * @param answer the answer submitted
    */
    function answerQuestion(uint256 questionId, string answer) public
    onlyActiveQuestion(questionId)
    whenNotPaused()
    {
        bool approvedOracle = canUserAnswerQuestion(msg.sender, questionId);
        require(approvedOracle);

        Question storage question = questions[questionId];
        question.alreadyAnswered = true;
        question.answer = answer;

        emit LogQuestionAnswered(questionId, msg.sender, answer);

        //Warning Untrusted contract call!
        ERC20 untrustedToken = ERC20(question.tokenContract);

        bool success = untrustedToken.transfer(msg.sender, question.bountyAmount);
        require(success);
    }

    /**
    * @dev Checks the permission for the specified user on the specified question.  Returns true if they are allowed
    * to answer it, false otherwise.
    * @param user Address of the user to check permission for
    * @param questionId ID of the question to check permission for
    */
    function canUserAnswerQuestion(address user, uint256 questionId) public view returns (bool) {
        return oracleAllowedQuestions[user][questionId];
    }

    /**
    * @dev Returns stored data for the specified question:
    * @param questionId Id of the question to retrieve information about
    */
    function getQuestion(uint256 questionId) external view returns (uint256, address, uint256, string, bool, string) {
        Question storage question = questions[questionId];
        return (question.id, question.tokenContract, question.bountyAmount, question.content, question.alreadyAnswered, question.answer);
    }

}
