// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title RecoveryPaymentContract
 * @notice Multi-token life recovery payments. Price is set per ERC-20 token (e.g. USDC vs tCOPM).
 */
contract RecoveryPaymentContract is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @notice Recovery price per token in that token's smallest unit.
    mapping(address => uint256) public recoveryPriceByToken;

    /// @notice Wallet that receives recovered payments.
    address public treasury;

    /// @notice ERC-20 tokens accepted for recovery.
    mapping(address => bool) public allowedTokens;

    event RecoveryPurchased(
        address indexed user,
        address indexed token,
        uint256 amount,
        uint256 timestamp
    );

    event RecoveryPriceUpdated(address indexed token, uint256 oldPrice, uint256 newPrice);
    event TokenAllowed(address indexed token, bool allowed);
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);

    error TokenNotAllowed();
    error InsufficientBalance();
    error InsufficientAllowance();
    error InvalidAddress();
    error InvalidPrice();

    constructor(address initialTreasury) Ownable(msg.sender) {
        if (initialTreasury == address(0)) revert InvalidAddress();
        treasury = initialTreasury;
    }

    /**
     * @notice Pay for one life recovery using an allowed ERC-20 token.
     * @param token Address of the ERC-20 token to pay with.
     */
    function purchaseRecovery(address token) external nonReentrant {
        if (!allowedTokens[token]) revert TokenNotAllowed();

        uint256 price = recoveryPriceByToken[token];
        if (price == 0) revert InvalidPrice();

        IERC20 erc20 = IERC20(token);

        if (erc20.balanceOf(msg.sender) < price) revert InsufficientBalance();
        if (erc20.allowance(msg.sender, address(this)) < price) {
            revert InsufficientAllowance();
        }

        erc20.safeTransferFrom(msg.sender, treasury, price);

        emit RecoveryPurchased(msg.sender, token, price, block.timestamp);
    }

    // ── Owner ────────────────────────────────────────────────────────────────

    function setRecoveryPriceForToken(address token, uint256 newPrice) external onlyOwner {
        if (token == address(0)) revert InvalidAddress();
        if (newPrice == 0) revert InvalidPrice();
        uint256 oldPrice = recoveryPriceByToken[token];
        recoveryPriceByToken[token] = newPrice;
        emit RecoveryPriceUpdated(token, oldPrice, newPrice);
    }

    function setAllowedToken(address token, bool allowed) external onlyOwner {
        if (token == address(0)) revert InvalidAddress();
        allowedTokens[token] = allowed;
        emit TokenAllowed(token, allowed);
    }

    function setTreasury(address newTreasury) external onlyOwner {
        if (newTreasury == address(0)) revert InvalidAddress();
        address oldTreasury = treasury;
        treasury = newTreasury;
        emit TreasuryUpdated(oldTreasury, newTreasury);
    }

    /** @notice Withdraw tokens accidentally sent to this contract. */
    function withdrawToken(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(treasury, amount);
    }
}
