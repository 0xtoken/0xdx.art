// SPDX-License-Identifier: MIT

pragma solidity 0.8.0;

contract Ownerable {
    constructor() {
        contractOwner = payable(msg.sender);
    }

    address payable public contractOwner;

    modifier onlyContractOwner {
        require(msg.sender == contractOwner, "Only Contract Owner");
        _;
    }
}
