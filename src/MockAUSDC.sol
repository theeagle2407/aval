// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title MockAUSDC
/// @notice A stand-in for a Cleanverse CVA A-Token, for LOCAL/TESTING USE ONLY.
/// @dev This is NOT the real AVAL lending asset. It exists purely so AvalLending can be
///      deployed and exercised (funding the treasury, borrowing, repaying) before a live
///      Cleanverse A-Token is wired up for the real demo. Swap ASSET_ADDRESS to the real
///      A-Token when one is available - do not use this contract in production.
contract MockAUSDC is ERC20, Ownable {
    constructor() ERC20("AVAL Test USD", "aUSD") Ownable(msg.sender) {}

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    /// @notice Mints `amount` of test aUSD to `to`. Owner-only, for seeding the demo treasury
    ///         and giving demo borrowers funds to repay with.
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
