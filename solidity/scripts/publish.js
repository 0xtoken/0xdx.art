require('dotenv').config();
const hre = require("hardhat");
const abi = require('../artifacts/contracts/Artifact.sol/Artifact.json').abi;
const admin = require("firebase-admin");
const serviceAccount = require('../xdx-art-firebase-adminsdk-qv284-e4eff736f4.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore()

async function main() {
    try {
        const [owner] = await hre.ethers.getSigners()
        const art = new hre.ethers.Contract(process.env.DEPLOYED_ADDRESS, abi, owner);

        const currentCount = await art.currentWorksCount()
        const newId = currentCount.toNumber() + 1
        const tx =
            await art.publish(`https://us-central1-xdx-art.cloudfunctions.net/artifacts/?item_id=${newId}`);

        const ARTIFACT = {
            //** certificate of art work */
            certificate: {
                artist_address: owner.address,
                artist_name: '',
                title: '',
                created_at: admin.firestore.FieldValue.serverTimestamp(),
                dimensions: {
                    height: 0,
                    width: 0,
                },
                signature: tx.hash,
                certificate_of_authenticity: 'This is to certify that the artwork represented as ERC721 identified herein is an original and authentic original produced by the artist Kusune. This data has the artist’s publishing digital transaction signature. All rights to the work are fully retained by the artist. Any unauthorized copying and replications are strictly prohibited without permissions. But the ownershipment is depending on “Transactions on Ethereum”.',
            },

            //** ERC721 metadata standard */
            name: this.title,
            description: '',
            image: '',
            attributes: [{
                "display_type": "date",
                "trait_type": "birthday",
                "value": new Date().valueOf()
            }]
        }

        await db.collection('artifacts').doc(String(newId))
            .set(ARTIFACT)
    } catch (err) {
        throw err;
    }
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });