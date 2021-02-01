/**
 * @type import('hardhat/config').HardhatUserConfig
 */
require('dotenv').config();
require('@nomiclabs/hardhat-waffle');

module.exports = {
  solidity: {
    version: "0.8.0",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000
      }
    }
  },
  networks: {
    rinkeby: {
      url: process.env.INFRA_URL,
      accounts: [`0x${process.env.PRIVATE_KEY}`]
    },
    main: {
      url: process.env.PRD_INFRA_URL,
      accounts: [`0x${process.env.PRIVATE_KEY}`]
    }
  }
};
