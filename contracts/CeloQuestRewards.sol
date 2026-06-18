// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title CeloQuestRewards
 * @notice Pays the weekly season champion in USDC.
 *         - finalizeSeasonReward: owner or automator (scheduled backend/cron).
 *         - finalizeSeasonRewardForced: owner only (manual admin override).
 */
contract CeloQuestRewards is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable rewardToken;

    /// @dev 0.05 USDC with 6 decimals (UI shows 5 USDC marketing prize)
    uint256 public constant REWARD_AMOUNT = 50_000;

    /// @dev Backend wallet allowed to finalize on schedule (automation).
    address public automator;

    mapping(bytes32 => bool) public seasonPaid;

    event SeasonRewardPaid(
        bytes32 indexed seasonId,
        address indexed winner,
        uint256 amount,
        uint256 timestamp,
        bool forced
    );

    event AutomatorUpdated(address indexed previous, address indexed current);

    error SeasonAlreadyPaid();
    error InvalidWinner();
    error InvalidAddress();
    error InsufficientBalance();
    error NotAuthorized();

    modifier onlyOwnerOrAutomator() {
        if (msg.sender != owner() && msg.sender != automator) revert NotAuthorized();
        _;
    }

    constructor(address token, address initialOwner, address initialAutomator) Ownable(initialOwner) {
        if (token == address(0) || initialOwner == address(0)) revert InvalidAddress();
        rewardToken = IERC20(token);
        automator = initialAutomator == address(0) ? initialOwner : initialAutomator;
    }

    function setAutomator(address newAutomator) external onlyOwner {
        if (newAutomator == address(0)) revert InvalidAddress();
        address previous = automator;
        automator = newAutomator;
        emit AutomatorUpdated(previous, newAutomator);
    }

    /**
     * @notice Automatic or routine payout — callable by owner or automator.
     */
    function finalizeSeasonReward(bytes32 seasonId, address winner)
        external
        onlyOwnerOrAutomator
        nonReentrant
    {
        _finalize(seasonId, winner, false);
    }

    /**
     * @notice Manual admin override — owner only.
     */
    function finalizeSeasonRewardForced(bytes32 seasonId, address winner)
        external
        onlyOwner
        nonReentrant
    {
        _finalize(seasonId, winner, true);
    }

    function _finalize(bytes32 seasonId, address winner, bool forced) internal {
        if (seasonPaid[seasonId]) revert SeasonAlreadyPaid();
        if (winner == address(0)) revert InvalidWinner();
        if (rewardToken.balanceOf(address(this)) < REWARD_AMOUNT) {
            revert InsufficientBalance();
        }

        seasonPaid[seasonId] = true;
        rewardToken.safeTransfer(winner, REWARD_AMOUNT);

        emit SeasonRewardPaid(seasonId, winner, REWARD_AMOUNT, block.timestamp, forced);
    }

    function isSeasonPaid(bytes32 seasonId) external view returns (bool) {
        return seasonPaid[seasonId];
    }

    /// @notice Fund the contract with USDC (owner must approve first).
    function deposit(uint256 amount) external onlyOwner {
        rewardToken.safeTransferFrom(msg.sender, address(this), amount);
    }
}
