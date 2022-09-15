const { expect } = require("chai");
const { solidity } = require("ethereum-waffle");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";


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
  }


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

    it("Should accept payment in USDT on contract's balance", async function () {
      const {hardhatMockPaymentToken, hardhatRound } = await loadFixture(deployFixture);
      await hardhatRound.buyTokens(ethers.utils.parseEther("10000"));
      //console.log("       📡...Buying 10 000 tokens");
      balanceRound = await hardhatMockPaymentToken.balanceOf(hardhatRound.address);
      //console.log("       🔮...USDT balance of Round contract after purchase: ", balanceRound);
      expect(balanceRound).to.be.gt(0);
    });

    // Should sell 1000 tokens for $17
    // Should not sell less than 588 tokens (≈$10)
    // Should not sell more than 30 000 000 tokens
    // Should transfer 10% of the tokens bought to user immidiately
  });

  describe("Vesting mechanics", function () {

    // Should lock 90% of the tokens bought
    // Should allow to claim tokens when unlocked
    // Should not allow to claim tokens when locked
    // Should allow to make 10 claims
    // Should reset the lock if user buys again
    // Should transfer 100% of purchased tokens to user after vesting (10 unlocks)
  });

  describe("Round mechanics", function () {

    // Should allow to purchase tokens if round is within the timeframe (start-end)
    // Should not allow to purchase tokens if round is not within the timeframe
    // Should allow to purchase tokens if round treasury is not empty
    // Should not allow to purchase tokens if round treasury is empty
  });
});
