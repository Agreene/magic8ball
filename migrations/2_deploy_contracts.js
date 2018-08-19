var Magic8Ball = artifacts.require("./Magic8Ball.sol");

//var SafeMath = artifacts.require("./SafeMath.sol");
//var SimpleToken = artifacts.require("./SimpleToken.sol");

module.exports = function(deployer) {
  deployer.deploy(Magic8Ball);


// TODO check if we need to deploy the SimpleToken + SafeMath etc... they're only used in tests...
//  deployer.deploy(SafeMath);
//  deployer.link(SafeMath, SimpleToken);
//  deployer.deploy(SimpleToken);
};
