// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {AvalLending} from "../src/AvalLending.sol";
import {MockAUSDC} from "../src/MockAUSDC.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title Deploy
/// @notice Deploys AvalLending to Monad testnet (chain 10143).
/// @dev If ASSET_ADDRESS is unset, deploys MockAUSDC as the lending asset (LOCAL/TESTING ONLY)
///      and seeds the pool treasury with 50,000 aUSD. If ASSET_ADDRESS is set, uses the real
///      A-Token at that address and skips minting/funding - fund the pool separately via
///      AvalLending.fund() once the deployer holds real A-Tokens.
contract Deploy is Script {
    uint256 internal constant TREASURY_SEED_AMOUNT = 50_000e6;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        address assetAddress = vm.envOr("ASSET_ADDRESS", address(0));
        bool usingMock = assetAddress == address(0);

        vm.startBroadcast(deployerPrivateKey);

        if (usingMock) {
            MockAUSDC mock = new MockAUSDC();
            assetAddress = address(mock);
            mock.mint(deployer, TREASURY_SEED_AMOUNT);
        }

        AvalLending lending = new AvalLending(assetAddress);

        if (usingMock) {
            IERC20(assetAddress).approve(address(lending), TREASURY_SEED_AMOUNT);
            lending.fund(TREASURY_SEED_AMOUNT);
        }

        vm.stopBroadcast();

        console.log("==================== AVAL Deployment ====================");
        console.log("Deployer:            ", deployer);
        console.log("Asset (aUSDC/A-Token):", assetAddress);
        console.log("Asset is mock:       ", usingMock);
        console.log("AvalLending:         ", address(lending));
        console.log("Validator (CCP):     ", 0xaC7e5179C2C7f03f209136886c172eb34F161792);
        console.log("===========================================================");
    }
}
