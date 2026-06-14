// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CeloColombianPesoTest
 * @notice Mock ERC-20 for CeloQuest on Celo Sepolia.
 *         Owner can mint additional test supply. Replace with real cCOPM on mainnet.
 */
contract CeloColombianPesoTest is ERC20, Ownable {
    uint8 private constant TOKEN_DECIMALS = 6;

    constructor() ERC20("Celo Colombian Peso Test", "tCOPM") Ownable(msg.sender) {
        _mint(msg.sender, 1_000_000 * 10 ** TOKEN_DECIMALS);
    }

    function decimals() public pure override returns (uint8) {
        return TOKEN_DECIMALS;
    }

    /// @notice Mint test tCOPM (owner only — deployer/admin wallet).
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
