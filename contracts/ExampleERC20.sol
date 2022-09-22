// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ExampleERC20 is ERC20 {
    constructor() ERC20("United States Dollar Circle", "USDC") {}

    function myMint() public {
        _mint(msg.sender, 100 * 10**decimals());
    }
}
