var HDWalletProvider = require("truffle-hdwallet-provider");

//Randomly generated for testnet.  mainnet mnemonics should never be committed in code
var mnemonic = "royal crash easily robust guitar mass enter neglect face guess bicycle eye urban sauce yard";

module.exports = {

  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*" // Match any network id
    },
    ropsten: {
      provider: () => new HDWalletProvider(mnemonic, "https://ropsten.infura.io/v3/a635a1064d204b989643463fbd04c841"),
      network_id: '3',
      gas: 4612388
    }
  }
};
