// deploy/00_deploy_contract.js

// to verify
// yarn verify --constructor-args ./contract-arguments/SeedRound-args.js --network bsc ADDRESS

const           { ethers } = require("hardhat");
const           localChainId = "31337";

const           CONTRACTS = ["SyndiqateToken",    // <--- specify contract names
                             //"MockPaymentToken",
                             "SeedRound"];

const           numContracts = CONTRACTS.length;

const           USDT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955"; // <---- set USDT address mainnet
//const           USDT_ADDRESS = "0x377533D0E68A22CF180205e9c9ed980f74bc5050"; // <---- set USDT address testnet
const           DEV_ADDRESS = "0x95e9450e2737e2239Be1CE225D79E4B2bE171f71"; // <----- set dev address EOA
//const           DEV_ADDRESS = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"; // <----- set dev address hardhat
const           ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";

module.exports = async ({ getNamedAccounts, deployments, getChainId }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = await getChainId();

  for (i = 0; i < numContracts; i += 1) {
    console.log("🌐 Deploying...");
    if (CONTRACTS[i] == "SeedRound") { // <--------------------- contracts with arguments
      let SQAT = await ethers.getContract(CONTRACTS[0], deployer);
      SQAT = SQAT.address;

      // let USDT = await ethers.getContract(CONTRACTS[1], deployer); // <--- comment out for production
      // USDT = USDT.address; // <--- comment out for production
      USDT = USDT_ADDRESS; // <--- enable for production

      await deploy(CONTRACTS[i], {
        from: deployer,
        args: [SQAT, USDT],
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

  // Transfer contract ownership to dev EOA
  let Contract;
  for (i = 0; i < numContracts; i += 1) {
    Contract = await ethers.getContract(CONTRACTS[i], deployer);
    if (CONTRACTS[i] == "SyndiqateToken") {
      await Contract.grantRole(ADMIN_ROLE, DEV_ADDRESS);
      await Contract.revokeRole(ADMIN_ROLE, deployer);
    }
    else {
      await Contract.transferOwnership(DEV_ADDRESS);
    }
    console.log("❗️ |", CONTRACTS[i], "| Ownership transfered to: ", DEV_ADDRESS);
  }

};
module.exports.tags = [CONTRACTS];
