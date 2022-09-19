// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ExampleERC20 is ERC20 {
    constructor() ERC20("United States Dollar Circle", "USDC") {
        _mint(msg.sender, 1000 * 10**decimals());
    }

    function myMint() public {
        _mint(msg.sender, 1000 * 10**decimals());
    }
}
