const {
    expect
} = require('chai');
const {
    ethers
} = require('hardhat');

describe('Token Contract', () => {

    let Artifact, artifact, owner, addr1, addr2, fee;

    beforeEach(async () => {
        fee = ethers.BigNumber.from('10000000000000000');
        Artifact = await ethers.getContractFactory('Artifact');
        artifact = await Artifact.deploy(fee);
        [owner, addr1, addr2] = await ethers.getSigners();
    });

    describe('Deployement', () => {
        it('Should set the right owner', async () => {
            expect(
                    await artifact.contractOwner()
                )
                .to
                .equal(owner.address);
        });

        it('Should set the right fee', async () => {
            expect(
                    await artifact.fee()
                )
                .to
                .equal(fee);
        });

        it('Should get initial max artifact count 0', async () => {
            expect(
                    await artifact.maxArtifactsCount()
                )
                .to
                .equal(42);
        });

        it('Should get initial currentWorksCount 0', async () => {
            expect(
                    await artifact.currentWorksCount()
                )
                .to
                .equal(0);
        })

        it('Should get initial balanceOf 0', async () => {
            expect(
                    await artifact.balanceOfContract()
                )
                .to
                .equal(0);
        });
    });

    describe('Transactions', () => {
        describe('Publish', () => {
            it('Should publish', async () => {
                const uri = 'example.com';
                await artifact.publish(uri);
                expect(
                        await artifact.ownerOf(1)
                    )
                    .to
                    .equal(owner.address);

                expect(
                        await artifact.currentWorksCount()
                    )
                    .to
                    .equal(1);

                expect(
                        await artifact.tokenURI(1)
                    )
                    .to
                    .equal('example.com');
            });

            it('Should not publish - publish limit', async () => {
                for (let i = 0; i < 42; i++) {
                    const uri = `example.com/${i}`;
                    await artifact.publish(uri);
                }

                expect(
                        await artifact.currentWorksCount()
                    )
                    .to
                    .equal(42);

                await expect(
                        artifact.publish('fail.com')
                    )
                    .to
                    .be
                    .revertedWith('No More Works Can Be Published');
            });

            it('Should not publish - only owner', async () => {
                const uri = 'example.com';
                await expect(
                        artifact.connect(addr1).publish(uri)
                    )
                    .to
                    .be
                    .revertedWith('Only Contract Owner');
            });
        });

        describe('Withdraw', () => {
            it('Shoud withdraw', async () => {
                const tx = {
                    to: artifact.address,
                    value: ethers.utils.parseEther('0.01')
                };
                await owner.sendTransaction(tx);

                expect(
                        await artifact.balanceOfContract()
                    )
                    .to
                    .equal(ethers.BigNumber.from('10000000000000000')); // use bignumber to avoid overflow 


                await artifact.withdraw();
                expect(
                        await artifact.balanceOfContract()
                    )
                    .to
                    .equal(0);
            });

            it('Shoud not withdraw - only owner', async () => {
                const tx = {
                    to: artifact.address,
                    value: ethers.utils.parseEther('0.01')
                };
                await owner.sendTransaction(tx);

                expect(
                        await artifact.balanceOfContract()
                    )
                    .to
                    .equal(ethers.BigNumber.from('10000000000000000')); // use bignumber to avoid overflow 


                await expect(
                        artifact.connect(addr1).withdraw()
                    )
                    .to
                    .be
                    .revertedWith('Only Contract Owner');
            });

            it('Shoud not withdraw - insufficient contract balance', async () => {
                await expect(
                        artifact.withdraw()
                    )
                    .to
                    .be
                    .revertedWith('Not Enough Balance Of Contract');
            });
        });

        describe('UpdateFee', () => {
            it('Shoud update fee', async () => {
                await artifact.updateFee(ethers.BigNumber.from('11000000000000000'));
                expect(
                        await artifact.fee()
                    )
                    .to
                    .equal(ethers.BigNumber.from('11000000000000000'));
            });

            it('Shoud not update fee - only owner', async () => {
                await expect(
                        artifact.connect(addr1).updateFee(ethers.BigNumber.from('11000000000000000'))
                    )
                    .to
                    .be
                    .revertedWith('Only Contract Owner');
            });

            it('Shoud not update fee - insufficient update fee', async () => {
                await expect(
                        artifact.updateFee(0)
                    )
                    .to
                    .be
                    .revertedWith('Invalid Fee Value');
            });
        });

        describe('RequestPrint', () => {
            it('Sould request print', async () => {
                // pubish
                const uri = 'example.com';
                await artifact.publish(uri);
                // approve
                await artifact.approve(addr1.address, 1);
                // transfer
                await artifact.transferFrom(owner.address, addr1.address, 1);

                // call request print
                await artifact.connect(addr1).requestPrint(1, {
                    value: ethers.BigNumber.from('10000000000000000')
                })

                const [addrs, timestamps] = await artifact.getPrintHistoriesByTokenId(1);
                expect(addrs).to.have.lengthOf(1);
                expect(timestamps).to.have.lengthOf(1);
                expect(addrs[0]).to.equal(addr1.address);

                const [ids, timestamps2] = await artifact.getPrintHistoriesByHolderAddress(addr1.address);
                expect(ids).to.have.lengthOf(1);
                expect(timestamps2).to.have.lengthOf(1);
                expect(ids[0]).to.equal(1);

                expect(
                        await artifact.balanceOfContract()
                    )
                    .to
                    .equal(ethers.BigNumber.from('10000000000000000'));
            });

            it('Should not request print - not token holder', async () => {
                // pubish
                const uri = 'example.com';
                await artifact.publish(uri);

                // call request print
                await expect(
                        artifact.connect(addr1).requestPrint(1, {
                            value: ethers.BigNumber.from('10000000000000000')
                        })
                    )
                    .to
                    .be
                    .revertedWith('Only Token Holder');
            });

            it('Should not request print - insufficient fee', async () => {
                // pubish
                const uri = 'example.com';
                await artifact.publish(uri);
                // approve
                await artifact.approve(addr1.address, 1);
                // transfer
                await artifact.transferFrom(owner.address, addr1.address, 1);

                // call request print
                await expect(
                        artifact.connect(addr1).requestPrint(1, {
                            value: ethers.BigNumber.from('100000000')
                        })
                    )
                    .to
                    .be
                    .revertedWith('Not Enough Fee Value');
            });
        });
    });


    describe('States', () => {

        beforeEach(async () => {
            // pubish
            const uri = 'example.com';
            await artifact.publish(uri);
            // approve
            await artifact.approve(addr1.address, 1);
            // transfer
            await artifact.transferFrom(owner.address, addr1.address, 1);

            // call request print
            await artifact.connect(addr1).requestPrint(1, {
                value: ethers.BigNumber.from('10000000000000000')
            })
        })

        describe('GetPrintHistoriesByTokenId', () => {
            it('Should get print histories by token id', async () => {
                const [addrs, timestamps] = await artifact.getPrintHistoriesByTokenId(1);
                expect(addrs).to.have.lengthOf(1);
                expect(timestamps).to.have.lengthOf(1);
                expect(addrs[0]).to.equal(addr1.address);
            });
            it('Should not get print histories by token id - invalid token id', async () => {
                await expect(
                        artifact.getPrintHistoriesByTokenId(42)
                    )
                    .to
                    .be
                    .revertedWith('Invalid Token Id');
            });
        });

        describe('GetPrintHistoriesByHolderAddress', () => {
            it('Should get print histories by token holder address', async () => {
                const [ids, timestamps2] = await artifact.getPrintHistoriesByHolderAddress(addr1.address);
                expect(ids).to.have.lengthOf(1);
                expect(timestamps2).to.have.lengthOf(1);
                expect(ids[0]).to.equal(1);
            });

            it('Shoud get print histories by token holder address - 0', async () => {
                const [ids, timestamps] = await artifact.getPrintHistoriesByHolderAddress(addr2.address);
                expect(ids).to.have.lengthOf(0);
                expect(timestamps).to.have.lengthOf(0);
            });
        });

        describe('CurrentWorksCount', () => {
            it('Should current works count 1', async () => {
                expect(
                        await artifact.currentWorksCount()
                    )
                    .to
                    .equal(1);
            })

            it('Should current works count 2', async () => {

                // pubish
                const uri = 'example.com/2';
                await artifact.publish(uri);

                expect(
                        await artifact.currentWorksCount()
                    )
                    .to
                    .equal(2);
            })
        });

        describe('BalanceOfContract', () => {
            it('Should balance of contract 10000000000000000', async () => {
                expect(
                        await artifact.balanceOfContract()
                    )
                    .to
                    .equal(ethers.BigNumber.from('10000000000000000'));
            });

            it('Should balance of contract 20000000000000000', async () => {
                // call request print
                await artifact.connect(addr1).requestPrint(1, {
                    value: ethers.BigNumber.from('10000000000000000')
                })
                expect(
                        await artifact.balanceOfContract()
                    )
                    .to
                    .equal(ethers.BigNumber.from('20000000000000000'));
            });

        });

    });
});