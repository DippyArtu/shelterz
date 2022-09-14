const { expect } = require("chai");
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
    await hardhatMockPaymentToken.mint(owner.address, 10000000000)

    // approve USDT for spend
    await hardhatMockPaymentToken.approve(hardhatRound.address, 100000000000000);

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
      expect(await hardhatMockPaymentToken.balanceOf(owner.address)).to.equal(10000000000);
    });

    it("Should set allowance for user", async function () {
      const {owner, hardhatMockPaymentToken, hardhatRound } = await loadFixture(deployFixture);
      expect(await hardhatMockPaymentToken.allowance(owner.address, hardhatRound.address)).to.equal(100000000000000);
    });
  });
});
