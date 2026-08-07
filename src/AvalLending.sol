// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IAPassComplianceValidator} from "./interfaces/IAPassComplianceValidator.sol";

/// @title AvalLending
/// @notice Undercollateralized lending pool where a borrower's verified on-chain identity
///         (their Cleanverse CVI tier, attested by the A-Pass compliance validator) stands
///         in for collateral. Credit limits are opened by the owner (the AVAL backend) once
///         it has read a borrower's exact tier via the A-Pass API, and grow automatically as
///         borrowers build a repayment track record.
contract AvalLending is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @notice The Cleanverse CCP validator deployed on Monad testnet (chain 10143).
    address public constant VALIDATOR_ADDRESS = 0xaC7e5179C2C7f03f209136886c172eb34F161792;

    /// @notice Minimum CVI tier required to open a credit line.
    uint256 public constant MIN_TIER = 20;

    /// @notice The A-Pass compliance validator used to gate borrowing on CVI status.
    IAPassComplianceValidator public immutable validator;

    /// @notice The lending asset (e.g. aUSDC), a 6-decimal ERC20 token.
    IERC20 public immutable asset;

    struct CreditLine {
        uint256 limit;
        uint256 debt;
        uint256 repaidCount;
        uint256 borrowedTotal;
        bool frozen;
        bool active;
    }

    mapping(address => CreditLine) private creditLines;

    /// @dev Tier-derived base limit for each borrower, used to cap reputation-based limit growth.
    mapping(address => uint256) private baseLimits;

    event CreditLineOpened(address indexed borrower, uint256 tier, uint256 limit);
    event Borrowed(address indexed borrower, uint256 amount);
    event Repaid(address indexed borrower, uint256 amount);
    event LimitIncreased(address indexed borrower, uint256 newLimit);
    event Frozen(address indexed borrower);
    event Unfrozen(address indexed borrower);
    event Funded(address indexed from, uint256 amount);
    event Withdrawn(address indexed to, uint256 amount);
    event PoolRuleRegistered(address indexed pool);

    constructor(address asset_) Ownable(msg.sender) {
        require(asset_ != address(0), "AvalLending: zero asset address");
        validator = IAPassComplianceValidator(VALIDATOR_ADDRESS);
        asset = IERC20(asset_);
    }

    /// @notice Opens (or re-opens) a credit line for `borrower` at the given verified CVI tier.
    /// @dev Owner-only: the backend has already read the borrower's exact tier via the A-Pass
    ///      API. This still re-checks compliance on-chain as a gate before granting a limit.
    /// @param borrower The borrower to open a credit line for.
    /// @param tier The borrower's verified CVI tier (0-100+).
    function openCreditLineFor(address borrower, uint256 tier) external onlyOwner {
        require(validator.complianceVerify(address(this), borrower), "AvalLending: not compliant");
        require(tier >= MIN_TIER, "insufficient verification");

        uint256 limit = _limitForTier(tier);

        CreditLine storage line = creditLines[borrower];
        line.limit = limit;
        line.active = true;
        baseLimits[borrower] = limit;

        emit CreditLineOpened(borrower, tier, limit);
    }

    /// @notice Borrows `amount` of `asset` against the caller's open credit line.
    /// @dev Live re-checks CVI compliance so a revoked A-Pass immediately blocks new borrowing.
    function borrow(uint256 amount) external nonReentrant {
        CreditLine storage line = creditLines[msg.sender];
        require(line.active, "AvalLending: no credit line");
        require(!line.frozen, "AvalLending: credit line frozen");
        require(validator.complianceVerify(address(this), msg.sender), "AvalLending: not compliant");
        require(line.debt + amount <= line.limit, "AvalLending: exceeds credit limit");
        require(asset.balanceOf(address(this)) >= amount, "AvalLending: insufficient liquidity");

        line.debt += amount;
        line.borrowedTotal += amount;

        emit Borrowed(msg.sender, amount);

        asset.safeTransfer(msg.sender, amount);
    }

    /// @notice Repays `amount` of `asset` against the caller's outstanding debt.
    /// @dev Fully clearing an outstanding loan grows the credit limit by 20% (compounding
    ///      reputation), capped at 2x the borrower's tier base limit.
    function repay(uint256 amount) external nonReentrant {
        require(amount > 0, "AvalLending: zero amount");

        CreditLine storage line = creditLines[msg.sender];
        require(line.active, "AvalLending: no credit line");

        asset.safeTransferFrom(msg.sender, address(this), amount);

        uint256 debtBefore = line.debt;
        uint256 reduction = amount > debtBefore ? debtBefore : amount;
        line.debt = debtBefore - reduction;

        emit Repaid(msg.sender, reduction);

        if (line.debt == 0 && debtBefore > 0 && line.borrowedTotal > 0) {
            line.repaidCount += 1;

            uint256 grownLimit = (line.limit * 120) / 100;
            uint256 cap = baseLimits[msg.sender] * 2;
            if (grownLimit > cap) {
                grownLimit = cap;
            }

            if (grownLimit > line.limit) {
                line.limit = grownLimit;
                emit LimitIncreased(msg.sender, grownLimit);
            }
        }
    }

    /// @notice Freezes a borrower's credit line, blocking further borrowing immediately.
    /// @dev Mirrors CVI revocation: when the backend freezes an A-Pass via update_status,
    ///      complianceVerify will also start returning false, but freeze() gives immediate
    ///      on-chain enforcement without waiting on the validator state.
    function freeze(address borrower) external onlyOwner {
        creditLines[borrower].frozen = true;
        emit Frozen(borrower);
    }

    /// @notice Unfreezes a previously frozen credit line.
    function unfreeze(address borrower) external onlyOwner {
        creditLines[borrower].frozen = false;
        emit Unfrozen(borrower);
    }

    /// @notice Returns whether `borrower` currently passes this pool's compliance rule.
    function isCompliant(address borrower) external view returns (bool) {
        return validator.complianceVerify(address(this), borrower);
    }

    /// @notice Returns the full credit line state for `borrower`.
    function getCreditLine(address borrower) external view returns (CreditLine memory) {
        return creditLines[borrower];
    }

    /// @notice Owner deposits `asset` into the pool to fund the lending treasury.
    function fund(uint256 amount) external onlyOwner nonReentrant {
        asset.safeTransferFrom(msg.sender, address(this), amount);
        emit Funded(msg.sender, amount);
    }

    /// @notice Owner withdraws `asset` from the pool treasury.
    function withdraw(uint256 amount) external onlyOwner nonReentrant {
        asset.safeTransfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount);
    }

    /// @notice Sets this pool's compliance rule on the validator, once the pool has been
    ///         registered with it (registration itself happens off-chain via the A-Pass API).
    function registerAsPool(IAPassComplianceValidator.RuleV2 calldata rule) external onlyOwner {
        validator.setRuleV2FromContract(rule);
        emit PoolRuleRegistered(address(this));
    }

    /// @dev Maps a verified CVI tier to its base credit limit, in the asset's 6-decimal units.
    function _limitForTier(uint256 tier) internal pure returns (uint256) {
        if (tier < 40) return 500e6;
        if (tier < 60) return 2000e6;
        if (tier < 80) return 5000e6;
        return 10000e6;
    }
}
