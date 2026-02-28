const { Wallat, Wallet } = require('ethers');
const wallet = new Wallet('0xc1c46d8f06533e4aa0899a933ee5ba8556b244b7f262cf1b4702c575257956a2');
console.log(wallet.address);
