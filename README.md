# Sailfish Prgammatically Swap Issue

## Overview
I'm currently working on a swap bot using the Sailfish protocol, following the guide from [Sailfish Documentation](https://sailfish.gitbook.io/docs/getting-started/why-sailfish). However, I've encountered an error when running the bot.

## Error Screenshot
![Error Screenshot] (https://i.postimg.cc/gj9VFR46/eror-sailfish.png "eror")

## Error Details
The bot is encountering a transaction revert error. Here's a snippet of the error message:

```
Error in transaction: missing revert data in call exception; Transaction reverted without a reason string [ See: https://links.ethers.org/v5-errors-CALL_EXCEPTION ] (data="0x", transaction={"from":"0x0247a71A06919c5216E2cDcDaCcc90fCaee455Fd","to":"0xB97582DCB6F2866098cA210095a04dF3e11B76A6",...})
```

## Questions
1. Is there something wrong with my code?
2. If so, could you help me solve this issue?
3. I'm curious and want to learn how the swap process with `execute` works.

## Request for Assistance
I would greatly appreciate any help or insights from the Sailfish team in resolving this issue. Understanding the inner workings of the swap process with `execute` would be extremely valuable for my learning process.

Thank you, Sailfish team!

## Additional Information
- The error occurs during the transaction simulation phase.
- The transaction is attempting to interact with the Sailfish router contract at address `0xB97582DCB6F2866098cA210095a04dF3e11B76A6`.
- The error suggests that the transaction is reverting, but no specific reason is provided.

