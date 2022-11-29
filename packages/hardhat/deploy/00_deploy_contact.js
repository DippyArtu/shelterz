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
const           TRANSFER_OWNERSHIP = 1; // <------ 0 — yes
                                        //         1 — no

//const           USDT_ADDRESS = "0x1852d5f604D23A646B1b4FcC64667C6A4C2CF845"; // <---- USDT goerly (mockpayment)
const           USDT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955"; // <---- USDT address BSC mainnet
//const           USDT_ADDRESS = "0x377533D0E68A22CF180205e9c9ed980f74bc5050"; // <---- USDT address BSC testnet

const           TOKEN_ADDRESS = "0xCf3Bb6AC0f6D987a5727e2d15e39c2D6061D5beC"; // <----- token address needed for round deploy (after initial)
//const           TOKEN_ADDRESS = "0x5D11948287c5a9747ED9612e11F51314B61BDfc9"; // <----- goerli token address

const           DEV_ADDRESS = "0x95e9450e2737e2239Be1CE225D79E4B2bE171f71"; // <----- dev address EOA
//const           DEV_ADDRESS = "0x6a8bf9f647d920a3f00470c313542088ad808285"; // <----- dev address hardhat
//const           DEV_ADDRESS = "0xc5F1a117838631225a85863C440223bd25dfD7b3"; // <----- dev address hardhat front

const           ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
const           TOKEN_CONTRACT_NAME = "ShelterzToken"; // <--- specify contract names

const           CONTRACTS = [TOKEN_CONTRACT_NAME,
                             "MockPaymentToken",      // <--- specify contract names
                             "Round"];                // <--- specify contract names
const           numContracts = CONTRACTS.length;










if (DEPLOY == 0) {
  module.exports = async ({ getNamedAccounts, deployments, getChainId }) => {
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
    const chainId = await getChainId();
  
    for (i = 0; i < numContracts; i += 1) {
      console.log("🌐 Deploying...");
      if (CONTRACTS[i] == "Round") { // <--------------------- contracts with arguments
        let TOKEN = await ethers.getContract(CONTRACTS[0], deployer);
        TOKEN = TOKEN.address;
  
        //let USDT = await ethers.getContract(CONTRACTS[1], deployer); // <--- comment out for production
        //USDT = USDT.address; // <--- comment out for production
        USDT = USDT_ADDRESS; // <--- enable for production
  
        await deploy(CONTRACTS[i], {
          from: deployer,
          args: [TOKEN, USDT],
          log: true,
          waitConfirmations: 5,
        });
      }
      else {
        await deploy(CONTRACTS[i], { // <--------------------- contracts with no arguments
          from: deployer,
          args: [],
          log: true,
          waitConfirmations: 5,
        });
      }
    }
    console.log("========= 📡 Contracts deployed! =========");
  
    if (TRANSFER_OWNERSHIP == 0) {
      // Transfer contract ownership to dev EOA
      //
      let Contract;
      for (i = 0; i < numContracts; i += 1) {
        Contract = await ethers.getContract(CONTRACTS[i], deployer);
        if (CONTRACTS[i] == TOKEN_CONTRACT_NAME) {
          await Contract.grantRole(ADMIN_ROLE, DEV_ADDRESS);
          await Contract.revokeRole(ADMIN_ROLE, deployer);
        }
        else {
          await Contract.transferOwnership(DEV_ADDRESS);
        }
        console.log("❗️ |", CONTRACTS[i], "| Ownership transfered to: ", DEV_ADDRESS);
      }
    }
  
    // Approve dev address USDT for spend
    //
    //let USDT = await ethers.getContract(CONTRACTS[1], deployer); // <--- comment out for production
     USDT = USDT_ADDRESS; // <--- enable for production
  
    let ROUND = await ethers.getContract(CONTRACTS[2], deployer);
    await USDT.approve(ROUND.address, ethers.utils.parseEther("200000000"));
    console.log("❗️ | Allowance for USDT updated!");
  };
  module.exports.tags = [CONTRACTS];
}



else if (DEPLOY == 1) {
  module.exports = async ({ getNamedAccounts, deployments, getChainId }) => {
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
    const chainId = await getChainId();
  
    console.log("🌐 Deploying...");
    TOKEN = TOKEN_ADDRESS;
    USDT = USDT_ADDRESS;

    await deploy(CONTRACTS[2], {
      from: deployer,
      args: [TOKEN, USDT],
      log: true,
      waitConfirmations: 5,
    });
    console.log("========= 📡 Contracts deployed! =========");
  
    if (TRANSFER_OWNERSHIP == 0) {
      // Transfer contract ownership to dev EOA
      //
      let Contract;
      for (i = 0; i < numContracts; i += 1) {
        Contract = await ethers.getContract(CONTRACTS[2], deployer);
        if (CONTRACTS[i] == TOKEN_CONTRACT_NAME) {
          await Contract.grantRole(ADMIN_ROLE, DEV_ADDRESS);
          await Contract.revokeRole(ADMIN_ROLE, deployer);
        }
        else {
          await Contract.transferOwnership(DEV_ADDRESS);
        }
        console.log("❗️ |", CONTRACTS[2], "| Ownership transfered to: ", DEV_ADDRESS);
      }
    }
  };
  module.exports.tags = [CONTRACTS];
}
