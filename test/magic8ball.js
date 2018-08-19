var Magic8Ball = artifacts.require("./Magic8Ball.sol");
var SimpleToken = artifacts.require("./SimpleToken.sol");


var helpers = require("./helpers.js");

contract('Magic8Ball', function(accounts) {

  //Use global variable for contract
  var magicContract;

  // The token that we will use
  var testTokenContract;


  //aliases to keep track of which account is which role
  var magicContractOwner = accounts[0];
  var questionAsker = accounts[1];
  var questionAnswerer = accounts[2];
  var slowerAnswerer = accounts[3];
  var notAllowedToAnswer = accounts[4];

  var allowedOracles = [questionAnswerer, slowerAnswerer]



  //Create new instance before each test to avoid contamination
  beforeEach(function() {
    return Magic8Ball.new({from: magicContractOwner})
    .then(function(instance) {
      magicContract = instance;
    });
  });
  beforeEach(function() {
    //the questionAsker account is the owner of the token contract so that they start out with tokens to use
    return SimpleToken.new({from: questionAsker})
    .then(function(instance) {
      testTokenContract = instance;
    });
  });


  it("should start at question id 0", async function() {
    return magicContract.nextQuestionId.call()
      .then(function(id) {
      assert.equal(id, 0, "0 wasn't the first question ID");
    });
  });

  it("should throw if bounty amount is not pre-approved with contract", async function() {
      await helpers.expectThrow(
        magicContract.askQuestion(testTokenContract.address, 100, "Knock knock?", accounts, {from: questionAsker})
      );
  });

  it("should increment next question ID after a question", async function() {
    return testTokenContract.approve(magicContract.address , 100, {from: questionAsker})
    .then(function() {
      return magicContract.askQuestion(testTokenContract.address, 100, "Knock knock?", allowedOracles, {from: questionAsker});
    }).then(function() {
      return magicContract.nextQuestionId.call();
    }).then(function(id) {
      assert.equal(id, 1, "1 wasn't the second question ID");
    });
  });


  it("should be able to create and retrieve questions", async function() {
    return testTokenContract.approve(magicContract.address , 400, {from: questionAsker})
    .then(function() {
      return magicContract.askQuestion(testTokenContract.address, 100, "Knock knock?", allowedOracles, {from: questionAsker});
    }).then(function() {
      return magicContract.askQuestion(testTokenContract.address, 300, "Who's there?", allowedOracles, {from: questionAsker});
    }).then(function() {
      return magicContract.getQuestion.call(0);
    }).then(function(question) {
      var [id, tokenContract, bountyAmount, content, alreadyAnswered] = question;
      assert.equal(id, 0, "0 wasn't the first question ID");
      assert.equal(tokenContract, testTokenContract.address, "First Token address wasn't correct");
      assert.equal(bountyAmount, 100, "First Bounty wasn't set at 100");
      assert.equal(content, "Knock knock?", "First Question content was not correct");
      assert.equal(alreadyAnswered, false, "First Question was marked as already answered");
    }).then(function() {
      return magicContract.getQuestion.call(1);
    }).then(function(question) {
      var [id, tokenContract, bountyAmount, content, alreadyAnswered] = question;
      assert.equal(id, 1, "1 wasn't the second question ID");
      assert.equal(tokenContract, testTokenContract.address, "Second Token address wasn't correct");
      assert.equal(bountyAmount, 300, "Second Bounty wasn't set at 300");
      assert.equal(content, "Who's there?", "Second Question content was not correct");
      assert.equal(alreadyAnswered, false, "Second Question was marked as already answered");
    });
  });
  
  
  
  it("should be able to answer a question", async function() {
    return testTokenContract.approve(magicContract.address , 100, {from: questionAsker})
    .then(function() {
      return magicContract.askQuestion(testTokenContract.address, 100, "Who's there?", allowedOracles, {from: questionAsker});
    }).then(function() {
      return magicContract.answerQuestion(0, "To get to the other side", {from: questionAnswerer});
    }).then(function() {
      return magicContract.getQuestion.call(0);
    }).then(function(question) {
      var [id, tokenContract, bountyAmount, content, alreadyAnswered, answer] = question;
      assert.equal(id, 0, "Incorrect question ID");
      assert.equal(tokenContract, testTokenContract.address, "Token address wasn't correct");
      assert.equal(bountyAmount, 100, "Bounty wasn't set at 100");
      assert.equal(content, "Who's there?", "Question content was not correct");
      assert.equal(alreadyAnswered, true, "Question was not marked as already answered");
      assert.equal(answer, "To get to the other side", "Answer was not correct");
    });
  });


  it("should pay the oracle with the bounty from the asker", async function() {
    return testTokenContract.balanceOf.call(questionAnswerer)
    .then(function(oracleBalance) {
      assert.equal(oracleBalance, 0, "Oracle should start out with 0 tokens");
      return testTokenContract.balanceOf.call(magicContract.address);
    }).then(function(contractBalance){
      assert.equal(contractBalance, 0, "Contract should start out with 0 tokens");
      return testTokenContract.approve(magicContract.address , 100, {from: questionAsker});
    }).then(function() {
      return magicContract.askQuestion(testTokenContract.address, 100, "Who's there?", allowedOracles, {from: questionAsker});
    }).then(function() {
      return testTokenContract.balanceOf.call(magicContract.address);
    }).then(function(contractBalance){
      assert.equal(contractBalance, 100, "Bounty should be transferred to contract after question is asked");
      return magicContract.answerQuestion(0, "To get to the other side", {from: questionAnswerer});
    }).then(function() {
      return testTokenContract.balanceOf.call(questionAnswerer);
    }).then(function(oracleBalance) {
      assert.equal(oracleBalance, 100, "Bounty should be transferred to the oracle after question is answered");
    });
  });


   it("should not be able to answer an already answered question", async function() {
    await helpers.expectThrow(
     testTokenContract.approve(magicContract.address , 100, {from: questionAsker})
     .then(function() {
       return magicContract.askQuestion(testTokenContract.address, 100, "Who's there?", allowedOracles, {from: questionAsker});
     }).then(function() {
       return magicContract.answerQuestion(0, "To get to the other side", {from: questionAnswerer});
     }).then(function() {
       return magicContract.answerQuestion(0, "It's me", {from: slowerAnswerer});
     })
     );
   });

   it("should not allow unapproved oracles to answer", async function() {
     await helpers.expectThrow(
      testTokenContract.approve(magicContract.address , 100, {from: questionAsker})
      .then(function() {
        return magicContract.askQuestion(testTokenContract.address, 100, "Who's there?", allowedOracles, {from: questionAsker});
      }).then(function() {
        return magicContract.answerQuestion(0, "It's me", {from: notAllowedToAnswer});
      })
      );
   });



   it("should emit events for questions and answers", async function() {
    testTokenContract.approve(magicContract.address , 100, {from: questionAsker})
    .then(function() {
      return magicContract.askQuestion(testTokenContract.address, 100, "Who's there?", allowedOracles, {from: questionAsker});
    }).then(function() {
      return magicContract.answerQuestion(0, "To get to the other side", {from: questionAnswerer});
    });

    await helpers.assertEvent(
        magicContract.LogQuestionAsked({}), {questionId: '0', asker: questionAsker, content: "Who's there?", bountyAmount: '100', tokenContract: testTokenContract.address}
    );

    await helpers.assertEvent(
        magicContract.LogQuestionAnswered({}), {questionId: '0', oracle: questionAnswerer, answer: "To get to the other side"}
    );
   });


   it("should allow asker to modify allowed oracles after question has been asked", async function() {
    return testTokenContract.approve(magicContract.address , 100, {from: questionAsker})
    .then(function() {
      return magicContract.askQuestion(testTokenContract.address, 100, "Who's there?", allowedOracles, {from: questionAsker});
    }).then(function() {
      return magicContract.canUserAnswerQuestion.call(notAllowedToAnswer, 0);
    }).then(function(canAnswer) {
      assert.equal(canAnswer, false, "User should not originally be allowed to answer");
      return magicContract.assignOracles(0, [notAllowedToAnswer] , {from: questionAsker});
    }).then(function() {
      return magicContract.canUserAnswerQuestion.call(notAllowedToAnswer, 0);
    }).then(function(canAnswer) {
      assert.equal(canAnswer, true, "User should be allowed to answer after granted permission");
      return magicContract.removeOracles(0, [notAllowedToAnswer] , {from: questionAsker});
    }).then(function() {
      return magicContract.canUserAnswerQuestion.call(notAllowedToAnswer, 0);
    }).then(function(canAnswer) {
      assert.equal(canAnswer, false, "User should not be allowed to answer after permission is removed");
    });
   });


   it("should only allow asker to modify allowed oracles", async function() {
     await helpers.expectThrow(
     testTokenContract.approve(magicContract.address , 100, {from: questionAsker})
     .then(function() {
       return magicContract.askQuestion(testTokenContract.address, 100, "Who's there?", allowedOracles, {from: questionAsker});
     }).then(function() {
       return magicContract.assignOracles(0, [notAllowedToAnswer] , {from: notAllowedToAnswer});
     })
     );

     await helpers.expectThrow(
     testTokenContract.approve(magicContract.address , 100, {from: questionAsker})
     .then(function() {
       return magicContract.askQuestion(testTokenContract.address, 100, "Who's there?", allowedOracles, {from: questionAsker});
     }).then(function() {
       return magicContract.removeOracles(0, allowedOracles , {from: notAllowedToAnswer});
     })
     );

   });

   it("should allow contract owner to pause operations", async function() {
    await helpers.expectThrow(
    magicContract.pause({from: magicContractOwner})
    .then(function(contractBalance){
      return testTokenContract.approve(magicContract.address , 100, {from: questionAsker});
    }).then(function() {
      return magicContract.askQuestion(testTokenContract.address, 100, "Who's there?", allowedOracles, {from: questionAsker});
    })
    );
   });

});
