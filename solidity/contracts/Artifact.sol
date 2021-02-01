// SPDX-License-Identifier: MIT

pragma solidity 0.8.0;

import "@openzeppelin/contracts/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/contracts/utils/Counters.sol";

import "./Ownerable.sol";
import "./TransferableByERC20.sol";

contract Artifact is Ownerable, TransferableByERC20 {
    // use counter.
    using Counters for Counters.Counter;

    // count of my published works.
    Counters.Counter private _tokenIds;

    // I only publish 42 of my works.
    uint8 public maxArtifactsCount = 42;

    // Token holders can request me to print physical works by calling request print function with fee.
    uint256 public fee;

    // Print history data.
    struct PrintHistory {
        address who;
        uint256 tokenId;
        uint256 blockTimeStamp;
    }

    // Mapping address to array of Physical print history data.
    mapping(address => PrintHistory[]) public printHistoriesByAddress;

    // Mapping tokenId to array of Physical print history data.
    mapping(uint256 => PrintHistory[]) public printHistoriesByTokenId;

    constructor(uint256 _fee) public ERC721("0xTokens", "OXT") {
        fee = _fee;
    }

    modifier onlyTokenHolder(uint256 _tokenId) {
        require(_exists(_tokenId), "Invalid Token Id");
        require(msg.sender == ownerOf(_tokenId), "Only Token Holder");
        _;
    }

    // Only Owner can publish works.
    function publish(string memory tokenURI)
        external
        onlyContractOwner
        returns (uint256)
    {
        _tokenIds.increment();
        require(
            maxArtifactsCount >= _tokenIds.current(),
            "No More Works Can Be Published"
        );
        uint256 newItemId = _tokenIds.current();
        _mint(contractOwner, newItemId);
        _setTokenURI(newItemId, tokenURI);
        return newItemId;
    }

    // Only owner can widthraw printing fee from contract.
    function withdraw() external onlyContractOwner returns (bool) {
        require(address(this).balance > 0, "Not Enough Balance Of Contract");
        payable(contractOwner).transfer(address(this).balance);
        return true;
    }

    // Only owner can update fee of printing.
    function updateFee(uint256 _newFee)
        external
        onlyContractOwner
        returns (bool)
    {
        require(_newFee > 0, "Invalid Fee Value");
        fee = _newFee;
        return true;
    }

    // Only onwer can check contract balance.
    function balanceOfContract()
        external
        view
        onlyContractOwner
        returns (uint256)
    {
        return address(this).balance;
    }

    // Only token holder can its physical print works with fee.
    function requestPrint(uint256 _tokenId)
        external
        payable
        onlyTokenHolder(_tokenId)
        returns (bool)
    {
        require(msg.value >= fee, "Not Enough Fee Value");
        PrintHistory memory ph =
            PrintHistory(msg.sender, _tokenId, block.timestamp);
        printHistoriesByAddress[msg.sender].push(ph);
        printHistoriesByTokenId[_tokenId].push(ph);
        return true;
    }

    // Get current numbers of works.
    function currentWorksCount() external view returns (uint256) {
        return _tokenIds.current();
    }

    // Get address array, and timestamp array, of target token print Hisotries.
    function getPrintHistoriesByTokenId(uint256 _tokenId)
        external
        view
        returns (address[] memory, uint256[] memory)
    {
        require(_exists(_tokenId), "Invalid Token Id");
        PrintHistory[] memory hisotires = printHistoriesByTokenId[_tokenId];

        address[] memory addrs = new address[](hisotires.length);
        uint256[] memory timestamps = new uint256[](hisotires.length);

        for (uint256 i = 0; i < hisotires.length; i++) {
            addrs[i] = hisotires[i].who;
            timestamps[i] = hisotires[i].blockTimeStamp;
        }

        return (addrs, timestamps);
    }

    // Get tokenId array, and timestamp array, of target holder's print Hisotries.
    function getPrintHistoriesByHolderAddress(address holder)
        external
        view
        returns (uint256[] memory, uint256[] memory)
    {
        PrintHistory[] memory hisotires = printHistoriesByAddress[holder];

        uint256[] memory tokenIds = new uint256[](hisotires.length);
        uint256[] memory timestamps = new uint256[](hisotires.length);

        for (uint256 i = 0; i < hisotires.length; i++) {
            tokenIds[i] = hisotires[i].tokenId;
            timestamps[i] = hisotires[i].blockTimeStamp;
        }

        return (tokenIds, timestamps);
    }

    fallback() external payable {}

    receive() external payable {}
}
