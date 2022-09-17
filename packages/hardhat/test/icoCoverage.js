const { expect } = require("chai");
const { solidity } = require("ethereum-waffle");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");


DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";


function sleep(milliseconds) {
  const date = Date.now();
  let currentDate = null;
  do {
    currentDate = Date.now();
  } while (currentDate - date < milliseconds);
}


describe("Token and CO Round Coverage", function () {

  // initial state for tests
  async function deployFixture() {
    const MockPaymentToken = await ethers.getContractFactory("MockPaymentToken");
    const ShelterzToken = await ethers.getContractFactory("ShelterzToken");
    const Round = await ethers.getContractFactory("Round");

    const [owner, addr1, addr2] = await ethers.getSigners();

    // deploy contracts
    const hardhatMockPaymentToken = await MockPaymentToken.deploy();
    await hardhatMockPaymentToken.deployed();

    const hardhatShelterzToken = await ShelterzToken.deploy();
    await hardhatShelterzToken.deployed();

    const hardhatRound = await Round.deploy(hardhatShelterzToken.address, hardhatMockPaymentToken.address);
    await hardhatRound.deployed();

    // mint USDT to owner
    await hardhatMockPaymentToken.mint(owner.address, ethers.utils.parseEther("10000000000"));

    // approve USDT for spend
    await hardhatMockPaymentToken.approve(hardhatRound.address, ethers.utils.parseEther("100000000000000"));

    // set lock period
    await hardhatRound.shortLock();

    return {
      MockPaymentToken,
      ShelterzToken,
      Round,
      hardhatMockPaymentToken,
      hardhatShelterzToken,
      hardhatRound,
      owner,
      addr1,
      addr2
    };
  };

  async function deployFixtureLongLock() {
    const MockPaymentToken = await ethers.getContractFactory("MockPaymentToken");
    const ShelterzToken = await ethers.getContractFactory("ShelterzToken");
    const Round = await ethers.getContractFactory("Round");

    const [owner, addr1, addr2] = await ethers.getSigners();

    // deploy contracts
    const hardhatMockPaymentToken = await MockPaymentToken.deploy();
    await hardhatMockPaymentToken.deployed();

    const hardhatShelterzToken = await ShelterzToken.deploy();
    await hardhatShelterzToken.deployed();

    const hardhatRound = await Round.deploy(hardhatShelterzToken.address, hardhatMockPaymentToken.address);
    await hardhatRound.deployed();

    // mint USDT to owner
    await hardhatMockPaymentToken.mint(owner.address, ethers.utils.parseEther("10000000000"));

    // approve USDT for spend
    await hardhatMockPaymentToken.approve(hardhatRound.address, ethers.utils.parseEther("100000000000000"));

    // set lock period
    await hardhatRound.longLock();

    return {
      MockPaymentToken,
      ShelterzToken,
      Round,
      hardhatMockPaymentToken,
      hardhatShelterzToken,
      hardhatRound,
      owner,
      addr1,
      addr2
    };
  };


  // checks that contracts deployed correctly
  describe("Deployment", function () {

    it("Should set the correct owner for the contracts", async function () {
      const {owner, hardhatMockPaymentToken, hardhatShelterzToken, hardhatRound } = await loadFixture(deployFixture);
      expect(await hardhatMockPaymentToken.owner()).to.equal(owner.address);
      expect(await hardhatShelterzToken.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.equal(true);
      expect(await hardhatRound.owner()).to.equal(owner.address);
    });

    it("Should issue Mock USDT to user", async function () {
      const {owner, hardhatMockPaymentToken } = await loadFixture(deployFixture);
      expect(await hardhatMockPaymentToken.balanceOf(owner.address)).to.equal(ethers.utils.parseEther("10000000000"));
    });

    it("Should set allowance for user", async function () {
      const {owner, hardhatMockPaymentToken, hardhatRound } = await loadFixture(deployFixture);
      expect(await hardhatMockPaymentToken.allowance(owner.address, hardhatRound.address)).to.equal(ethers.utils.parseEther("100000000000000"));
    });
  });

  describe("Sale mechanics", function () {

    it("Should sell 1000 tokens for 17 USDT", async function () {
      const {hardhatMockPaymentToken, hardhatRound } = await loadFixture(deployFixture);
      // purchase 1000 tokens
      await hardhatRound.buyTokens(ethers.utils.parseEther("1000"));
      balanceRound = await hardhatMockPaymentToken.balanceOf(hardhatRound.address);
      expect(balanceRound).to.be.equal(ethers.utils.parseEther("17"));
    });

    it("Should not sell less than 588 tokens (≈$10)", async function () {
      const {hardhatRound } = await loadFixture(deployFixture);
      await expect(hardhatRound.buyTokens(ethers.utils.parseEther("500"))).to.be.reverted;
    });

    it("Should not sell more than 30 000 000 tokens", async function () {
      const {hardhatRound } = await loadFixture(deployFixture);
      await expect(hardhatRound.buyTokens(ethers.utils.parseEther("35000000"))).to.be.reverted;
    });

    it("Should transfer 10% of the tokens bought to user immidiately", async function () {
      const {owner, hardhatRound, hardhatShelterzToken} = await loadFixture(deployFixture);
      // purchase 1000 tokens
      await hardhatRound.buyTokens(ethers.utils.parseEther("1000"));
      expect(await hardhatShelterzToken.balanceOf(owner.address)).to.be.equal(ethers.utils.parseEther("100"));
    });
  });

  describe("Vesting mechanics", function () {

    it("Should lock 90% of the tokens bought", async function () {
      const {owner, hardhatRound} = await loadFixture(deployFixture);
      await hardhatRound.buyTokens(ethers.utils.parseEther("1000"));
      userStruct = await hardhatRound.users(owner.address);
      expect(userStruct.pendingForClaim).to.be.equal(ethers.utils.parseEther("900"));
    });

    it("Should allow to claim 10% of tokens when unlocked", async function () {
      const {owner, hardhatRound, hardhatShelterzToken} = await loadFixture(deployFixture);
      // purchase 1000 tokens
      await hardhatRound.buyTokens(ethers.utils.parseEther("1000"));
      sleep(1001);
      await hardhatRound.claimTokens();
      // checking if 20% claimed (10% initial + 10% new)
      expect(await hardhatShelterzToken.balanceOf(owner.address)).to.be.equal(ethers.utils.parseEther("190"));
    });

    it("Should not allow to claim tokens when locked", async function () {
      const {hardhatRound} = await loadFixture(deployFixtureLongLock);
      // purchase 1000 tokens
      await hardhatRound.buyTokens(ethers.utils.parseEther("1000"));
      // trying to claim again straight away
      await expect(hardhatRound.claimTokens()).to.be.reverted;
      //await expect(hardhatRound.claimTokens()).to.be.reverted;
    });

    it("Should not allow to make more than 10 claims (without reseting)", async function () {
      const {hardhatRound} = await loadFixture(deployFixture);
      // purchase 1000 tokens
      await hardhatRound.buyTokens(ethers.utils.parseEther("1000"));
      // claim 10 times
      for (let i = 0; i < 10; i++) {
        sleep(1001);
        await hardhatRound.claimTokens();
      }
      sleep(1001);
      await expect(hardhatRound.claimTokens()).to.be.reverted;
    });

    it("Should transfer 100% of purchased tokens to user after vesting (10 unlocks)", async function () {
      const {owner, hardhatRound, hardhatShelterzToken} = await loadFixture(deployFixture);
      // purchase 1000 tokens
      await hardhatRound.buyTokens(ethers.utils.parseEther("1000"));
      // claim 10 times
      for (let i = 0; i < 10; i++) {
        sleep(1001);
        await hardhatRound.claimTokens();
      }
      // get user pending balance from struct
      userStruct = await hardhatRound.users(owner.address);
      expect(userStruct.pendingForClaim).to.be.equal(0);
      // get user token balance
      expect(await hardhatShelterzToken.balanceOf(owner.address)).to.be.equal(ethers.utils.parseEther("1000"));
    });

    it("Should reset the lock if user buys again", async function () {
      const {owner, hardhatRound} = await loadFixture(deployFixture);
      // purchase 1000 tokens
      await hardhatRound.buyTokens(ethers.utils.parseEther("1000"));
      // claim once
      sleep(1001);
      await hardhatRound.claimTokens();
      // read user number of claims
      userStruct = await hardhatRound.users(owner.address);
      expect(userStruct.numUnlocks).to.be.equal(1);
      // purchase another 1000 tokens
      await hardhatRound.buyTokens(ethers.utils.parseEther("1000"));
      // read user number of claims
      userStruct = await hardhatRound.users(owner.address);
      expect(userStruct.numUnlocks).to.be.equal(0);
    });
  });

  describe("Round mechanics", function () {

    // Should allow to purchase tokens if round is within the timeframe (start-end)
    // Should not allow to purchase tokens if round is not within the timeframe
    // Should allow to purchase tokens if round treasury is not empty
    // Should not allow to purchase tokens if round treasury is empty
  });
});
