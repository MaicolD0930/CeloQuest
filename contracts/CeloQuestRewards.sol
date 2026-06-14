// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title CeloQuestRewards
 * @notice Pays the weekly season champion in tCOPM. Only the contract owner
 *         (admin treasury wallet) may finalize rewards. Each seasonId can be paid once.
 */
contract CeloQuestRewards is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable rewardToken;

    /// @dev 25,000 tCOPM with 6 decimals
    uint256 public constant REWARD_AMOUNT = 25_000 * 10 ** 6;

    mapping(bytes32 => bool) public seasonPaid;

    event SeasonRewardPaid(
        bytes32 indexed seasonId,
        address indexed winner,
        uint256 amount,
        uint256 timestamp
    );

    error SeasonAlreadyPaid();
    error InvalidWinner();
    error InvalidAddress();
    error InsufficientBalance();

    constructor(address token, address initialOwner) Ownable(initialOwner) {
        if (token == address(0) || initialOwner == address(0)) revert InvalidAddress();
        rewardToken = IERC20(token);
    }

    /**
     * @notice Transfer weekly champion reward. Callable only by owner (admin wallet).
     * @param seasonId Unique season identifier (keccak256 of off-chain weekKey).
     * @param winner Champion wallet address.
     */
    function finalizeSeasonReward(bytes32 seasonId, address winner)
        external
        onlyOwner
        nonReentrant
    {
        if (seasonPaid[seasonId]) revert SeasonAlreadyPaid();
        if (winner == address(0)) revert InvalidWinner();
        if (rewardToken.balanceOf(address(this)) < REWARD_AMOUNT) {
            revert InsufficientBalance();
        }

        seasonPaid[seasonId] = true;
        rewardToken.safeTransfer(winner, REWARD_AMOUNT);

        emit SeasonRewardPaid(seasonId, winner, REWARD_AMOUNT, block.timestamp);
    }

    function isSeasonPaid(bytes32 seasonId) external view returns (bool) {
        return seasonPaid[seasonId];
    }

    /// @notice Fund the contract with tCOPM (owner must approve first).
    function deposit(uint256 amount) external onlyOwner {
        rewardToken.safeTransferFrom(msg.sender, address(this), amount);
    }

}
