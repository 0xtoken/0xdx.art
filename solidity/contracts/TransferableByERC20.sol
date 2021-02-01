// SPDX-License-Identifier: MIT

pragma solidity 0.8.0;

import "@openzeppelin/contracts/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/contracts/utils/Address.sol";

abstract contract TransferableByERC20 is ERC721 {
    // use counter.
    using Address for *;

    event PairCreated(address indexed token0, uint256 tokenId, uint256 price);
    event PairStatusUpdated(
        address indexed token0,
        uint256 tokenId,
        uint256 price,
        bool status
    );

    mapping(address => mapping(uint256 => uint256)) public getPairPrice;
    mapping(address => mapping(uint256 => bool)) public isPairAvailable;

    modifier validate(
        address aTokenAddress,
        uint256 tokenId,
        uint256 price
    ) {
        require(
            Address.isContract(aTokenAddress),
            "Address Must Be Contract Address"
        );

        require(_exists(tokenId), "Invalid TokenId");
        require(ownerOf(tokenId) == msg.sender, "Only Token Holder");
        require(price > 0x0, "Price Insufficient");
        _;
    }

    function createPair(
        address aTokenAddress,
        uint256 tokenId,
        uint256 price
    ) external validate(aTokenAddress, tokenId, price) returns (bool) {
        getPairPrice[aTokenAddress][tokenId] = price;
        isPairAvailable[aTokenAddress][tokenId] = true;
        emit PairCreated(aTokenAddress, tokenId, price);

        return true;
    }

    function updatePairStatus(
        address aTokenAddress,
        uint256 tokenId,
        uint256 price,
        bool status
    ) external validate(aTokenAddress, tokenId, price) returns (bool) {
        getPairPrice[aTokenAddress][tokenId] = price;
        isPairAvailable[aTokenAddress][tokenId] = status;
        emit PairStatusUpdated(aTokenAddress, tokenId, price, status);
        return true;
    }

    function isTransferableByAtoken(
        address aTokenAddress,
        uint256 tokenId,
        address holder,
        address beneficiary
    ) public view returns (bool) {
        require(
            Address.isContract(aTokenAddress),
            "Address Must Be Contract Address"
        );
        require(_exists(tokenId), "Invalid TokenId");
        require(ownerOf(tokenId) == holder, "Holder Must Be Token Holder");
        require(
            ownerOf(tokenId) != beneficiary,
            "Beneficiary Must No Be Token Holder"
        );
        require(isPairAvailable[aTokenAddress][tokenId], "Pair Unavailable");

        // Atoken Price for Token by tokenId
        uint256 price = getPairPrice[aTokenAddress][tokenId];

        IERC20 Atoken = IERC20(aTokenAddress);
        //  AToken を利用し holder から beneficiary に Token を移動する場合に beneficiary が ATokenの allowance が holder に対して十分あるか確認
        uint256 allowance = Atoken.allowance(beneficiary, holder);
        require(allowance >= price, "Insufficient allowance amount of Atoken");

        // erc721 が approve されているか
        require(
            getApproved(tokenId) == beneficiary ||
                isApprovedForAll(holder, beneficiary),
            "Token Not Approved"
        );

        // update price func もつくるgtny
        return true;
    }

    function transferByAtoken(
        address aTokenAddress,
        uint256 tokenId,
        address holder,
        address beneficiary
    ) external returns (bool) {
        require(
            isTransferableByAtoken(aTokenAddress, tokenId, holder, beneficiary),
            "Transfer Not Allowed"
        );

        return true;
    }
}
