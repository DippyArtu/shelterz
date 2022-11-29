// deploy/00_deploy_contract.js


// Goerly
//
// Token - 0x5D11948287c5a9747ED9612e11F51314B61BDfc9
// Round - 0x364E9DFEf1330cc954617ae360851d6d3293FC69
// USDT — 0x1852d5f604D23A646B1b4FcC64667C6A4C2CF845

// to verify
// yarn verify --constructor-args ./contract-arguments/Round-args.js --network bsc ADDRESS

const           { ethers } = require("hardhat");
const           localChainId = "31337";

const           DEPLOY = 1    // <------- 0 — initial deploy (token + round)
                              //          1 — round deploy
const           TRANSFER_OWNERSHIP = 0; // <------ 0 — yes
                                        //         1 — no

//const           USDT_ADDRESS = "0x1852d5f604D23A646B1b4FcC64667C6A4C2CF845"; // <---- USDT goerly (mockpayment)
const           USDT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955"; // <---- USDT address BSC mainnet
//const           USDT_ADDRESS = "0x377533D0E68A22CF180205e9c9ed980f74bc5050"; // <---- USDT address BSC testnet

const           TOKEN_ADDRESS = "0xCf3Bb6AC0f6D987a5727e2d15e39c2D6061D5beC"; // <----- token address needed for round deploy (after initial)
//const           TOKEN_ADDRESS = "0x5D11948287c5a9747ED9612e11F51314B61BDfc9"; // <----- goerli token address

const           DEV_ADDRESS = "0x8B0C805D526304f436b54A691664B25ab238DAB0"; // <----- dev address EOA
//const           DEV_ADDRESS = "0x6a8bf9f647d920a3f00470c313542088ad808285"; // <----- dev address hardhat
//const           DEV_ADDRESS = "0xc5F1a117838631225a85863C440223bd25dfD7b3"; // <----- dev address hardhat front

const           ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
const           TOKEN_CONTRACT_NAME = "ShelterzToken"; // <--- specify contract names

const           CONTRACTS = [TOKEN_CONTRACT_NAME,
                             "MockPaymentToken",      // <--- specify contract names
                             "Round"];                // <--- specify contract names
const           numContracts = CONTRACTS.length;


const { deployer } = await getNamedAccounts();

if (TRANSFER_OWNERSHIP == 0) {
  // Transfer contract ownership to dev EOA
  //
  await transferOwner();
}

async function transferOwner() {
  let Contract;
  Contract = await ethers.getContractAt("Round", "0x6a8321cAeE1e1409f2DA0CB87c513f2DD773573b", deployer);
  await Contract.transferOwnership(DEV_ADDRESS);
  console.log("❗️ |", CONTRACTS[2], "| Ownership transfered to: ", DEV_ADDRESS);
}

