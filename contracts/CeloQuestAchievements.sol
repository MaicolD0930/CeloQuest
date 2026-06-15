// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title CeloQuestAchievements
 * @notice ERC-1155 achievement badges for CeloQuest.
 *         Token IDs 1–5: personal (one mint per wallet). IDs 6–8: weekly competitive.
 */
contract CeloQuestAchievements is ERC1155, Ownable {
    using Strings for uint256;

    string private _baseTokenURI;

    /// @dev Personal achievements (1–5) can only be minted once per wallet.
    mapping(address => mapping(uint256 => bool)) public personalClaimed;

    event AchievementMinted(
        address indexed to,
        uint256 indexed tokenId,
        uint256 amount
    );

    error InvalidTokenId();
    error PersonalAlreadyClaimed();

    constructor(string memory baseURI_, address initialOwner)
        ERC1155("")
        Ownable(initialOwner)
    {
        _baseTokenURI = baseURI_;
    }

    function setBaseURI(string memory baseURI_) external onlyOwner {
        _baseTokenURI = baseURI_;
    }

    function uri(uint256 tokenId) public view override returns (string memory) {
        return string(abi.encodePacked(_baseTokenURI, tokenId.toString(), ".json"));
    }

    /**
     * @notice Mint a personal achievement (token IDs 1–5). Once per wallet per ID.
     */
    function mintPersonal(address to, uint256 tokenId) external onlyOwner {
        if (tokenId < 1 || tokenId > 5) revert InvalidTokenId();
        if (personalClaimed[to][tokenId]) revert PersonalAlreadyClaimed();
        personalClaimed[to][tokenId] = true;
        _mint(to, tokenId, 1, "");
        emit AchievementMinted(to, tokenId, 1);
    }

    /**
     * @notice Mint a weekly competitive badge (token IDs 6–8). Repeatable each season.
     */
    function mintCompetitive(address to, uint256 tokenId) external onlyOwner {
        if (tokenId < 6 || tokenId > 8) revert InvalidTokenId();
        _mint(to, tokenId, 1, "");
        emit AchievementMinted(to, tokenId, 1);
    }
}
