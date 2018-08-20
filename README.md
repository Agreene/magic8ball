# Magic 8 Ball

All newly written solidity code is located in  Magic8Ball.sol

Address on Ropsten testnet: https://ropsten.etherscan.io/address/0xe78f9e045af010a88a83c40c959792080c1e4bf6

All contracts in the 'zeppelin' directory are helper/utility contracts taken from the OpenZeppelin github project

SafeMath, StandardToken, and SimpleToken are only used for tests, and are not deployed with the main contract.



### How to use:

##### To Ask a Question 
`function askQuestion(address tokenContract, uint256 bountyAmount, string question, address[] oracles)`

Askers can pay with any ERC20 token they like.  They must specify the contract address for the token they are using to pay, and also the amount.
Before submitting a question, the askers must 'approve' the amount of the bounty with the token contract they are using.  
The Magic8Ball contract contract will attempt a transferFrom operation from their account to itself -- if that operation fails, their question is rejected

Askers are also required to specify one more more addresses as 'potential oracles' who are approved to answer their question.  Only addresses that are approved may answer the question.
If the asker changes their mind later, they may add/remove users from their question's approved oracle list through the assignOracles and removeOracles functions.

##### To Answer a Question
`function answerQuestion(uint256 questionId, string answer) public whenNotPaused()`
Only oracles that the asker has approved may answer the question. The first approved oracle to answer is rewarded the token, and then the question is closed and no more answers are allowed





##### Possible Design Improvements
The burden of choosing an appropriate oracle is placed entirely upon the asker in this implementation.  Some of this difficulty could be mitigated by implementing a 'reputation' system, whereby askers can rate the quality of respones from an oracle.  This would provide future askers with more knowledge about which oracles to choose.

### Other Designs Considered
A central difficulty for implementing an oracle system in a decentralized environment is lack of trust in the quality of the answers.  Several implementations for choosing the 'best' answer to receive the reward token were considered.

##### Always Choose the First Answer
Anyone is allowed to answer and the first answer is always selected to receive the reward.

Cons
- Encourages a nonsensical immediate reply to earn the reward.  

##### Randomly Choose the Answer 
One of the users who submitted an answer is randomly selected to receive the reward

Cons
- True randomness on the blockchain is difficult, and pseudorandom solutions can frequently be manipulated by miners
- Encourages users to spam the same answer from multiple addresses for a higher chance of winning

##### The Asker Chooses the Answer
At any point after submitting their question, the asker selects an answer from among those submitted, and that user will receive the reward.

Cons
- Asker may 'disappear' and never choose an answer
- Asker could submit an answer through a proxy account, and choose their own response to get their token back (after having read through the other responses to find 
                                                             the actual answer they're looking for). 

##### Users Vote for the Best Answer
Users vote for the best answer using a secret ballot system where their votes are encrypted and later revealed. The answer with the most votes is selected.  Users would be (monetarily) rewarded for voting for the answer that was selected, and penalized for voting for any other answer.  This would theoretically encourage users to vote for the best answer.

Cons
- Requires choose a way to select the pool of eligible voters, and also how to weight their votes
- Requires game theory analysis/experiment to find correct rewards/penalties
- The rewards/penalties may encourage users to vote for the answer they suspect will be the most popular, rather than the true best answer.
- Even with secret ballot, groups of users may still team up and use a third party software to collude on their votes
