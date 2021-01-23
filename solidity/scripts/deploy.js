const hre = require("hardhat");

async function main() {

    const ethFee = '0.1'
    const fee = hre.ethers.BigNumber.from(hre.ethers.utils.parseEther(ethFee));

    const Artifact = await hre.ethers.getContractFactory("Artifact");
    const art = await Artifact.deploy(fee);
    await art.deployed();

    console.log("Art deployed to:", art.address);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });