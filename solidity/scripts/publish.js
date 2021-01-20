require('dotenv').config();
const hre = require("hardhat");
const abi = require('../artifacts/contracts/Artifact.sol/Artifact.json').abi;

async function main() {
    const [owner] = await hre.ethers.getSigners()
    const art = new hre.ethers.Contract(process.env.DEPLOYED_ADDRESS, abi, owner);
    
    const tx = await art.publish('https://example.com/2');
    
    console.log(tx);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });