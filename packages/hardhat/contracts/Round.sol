//TODO:
// - admin free mint to wallet

// SPDX-License-Identifier: MIT
//
//--------------------------
// 5F 30 78 30 30 6C 61 62
//--------------------------
//
// Syndiqate ICO seed round contract
// [+] Ownable
// [+] ERC20 interface
// [+] Accepts payment in USDT
// [+] Tokens timelocked with release over 10 months
//
// UI:
//
// - Is round active ==========================================> [bool]    isActive
// - Round end date ===========================================> [uint256] ROUND_END_DATE
// - Tokens left ==============================================> [uint256] availableTreasury
// - Return user liquid balance ===============================> [uint256] users[msg.sender].liquidBalance
// - Pending for claim for user ===============================> [uint256] users[msg.sender].pendingForClaim
// - Next unlock date for user ================================> [uint256] users[msg.sender].nextUnlockDate
// - Check allowance ==========================================> [uint256] USDT.allowance(msg.sender, address(this))
// - Buy tokens (recieve in USDT, input amount in TERZ) =======>           buyTERZ(uint256 _amount)
// - Check if user tokens unlocked and transfer them to user ==>           claimTokens()
// - Set allowance ============================================> call USDT contract from website directly
//                                                       approve amount = 200000000000000000000000000 wei
//                                                       this is WEI too much (🤡) but we'll never spend
//                                                       more than 50k, this allows us to track
//                                                       TERZ purchase amount limits
//
// DEPLOYMENT:
//
// - Deploy TERZ token
// - Deploy SeedRound, pass TERZ && USDT token addresses to constructor

pragma solidity ^0.8.4;

import "../libs/@openzeppelin/contracts/access/Ownable.sol";
import "../libs/@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "./interfaces/ITERZ.sol";

contract Round is Ownable {

  // -------------------------------------------------------------------------------------------------------
  // ------------------------------- ROUND PARAMETERS
  // -------------------------------------------------------------------------------------------------------

  // @notice                            round conditions
  uint256 constant public               SEED_ROUND_FUND = 30000000 ether;
  uint256 constant public               TERZ_PRICE_USDT = 17;                 // 0.017 usdt
  uint256 constant public               MIN_PURCHASE_AMOUNT = 588 ether;      // 10 usdt
  uint256 constant public               ROUND_START_DATE = 1657324800;        // 09.07.22 00:00
  uint256 constant public               ROUND_END_DATE = 1757761958;          // 18.07.22 00:00
  uint256  public               LOCK_PERIOD; // 30 days

  function shortLock() external onlyOwner() { /////////////////// DEBUG !!!!!!
    LOCK_PERIOD = 1 seconds;
  }
  
  function longLock() external onlyOwner() {
    LOCK_PERIOD = 2 seconds;
  }

  // @notice                            token interfaces
  address public                        TERZAddress;
  address public                        usdtAddress;
  ITERZ                                 TERZ;
  IERC20                                USDT;

  // @notice                            round state
  uint256 public                        availableTreasury = SEED_ROUND_FUND;
  bool    public                        isActive;




  // -------------------------------------------------------------------------------------------------------
  // ------------------------------- USER MANAGMENT
  // -------------------------------------------------------------------------------------------------------

  // @notice                            user state structure
  struct                                User {
    uint256                             totalTERZBalance;   // total num of tokens user have bought through the contract
    uint256                             liquidBalance;      // amount of tokens the contract already sent to user
    uint256                             pendingForClaim;    // amount of user's tokens that are still locked
    uint256                             nextUnlockDate;     // unix timestamp of next claim unlock (defined by LOCK_PERIOD)
    uint8                               numUnlocks;         // 10 in total
    bool                                isLocked;           // are tokens currently locked
    uint256                             initialPayout;      // takes into account 10% initial issue
  }

  // @notice                            keeps track of users
  mapping(address => User) public       users;
  address[] public                      icoTokenHolders;




  // -------------------------------------------------------------------------------------------------------
  // ------------------------------- EVENTS
  // -------------------------------------------------------------------------------------------------------

  event                                 TERZPurchased(address indexed user, uint256 amount);
  event                                 TERZClaimed(address indexed user,
                                                    uint256 amount,
                                                    uint256 claimsLeft,
                                                    uint256 nextUnlockDate);




  // FUNCTIONS
  //
  // -------------------------------------------------------------------------------------------------------
  // ------------------------------- Constructor
  // -------------------------------------------------------------------------------------------------------

  // @param                             [address] TERZ => TERZ token address
  // @param                             [address] usdt => USDT token address
  constructor(address terz, address usdt) {
    TERZAddress = terz;
    usdtAddress = usdt;
    TERZ = ITERZ(terz);
    USDT = IERC20(usdt);
    TERZ.grantManagerToContractInit(address(this), SEED_ROUND_FUND);
    isActive = true;
  }




  // -------------------------------------------------------------------------------------------------------
  // ------------------------------- Modifiers
  // -------------------------------------------------------------------------------------------------------

  // @notice                            checks if tokens could be sold
  // @param                             [uint256] amount => amount of tokens to sell
  modifier                              areTokensAvailable(uint256 amount) {
    require(amount >= MIN_PURCHASE_AMOUNT,
                      "Lower than min purchase amount!");
    require(availableTreasury - amount >= 0,
                      "Not enough TERZ tokens left!");
    require(USDT.allowance(msg.sender, address(this)) >= amount,
                      "Not enough allowance, approve your USDT first!");
    _;
  }

  // @notice                            checks whether user's tokens are locked
  modifier                              checkLock() {
    require(users[msg.sender].pendingForClaim > 0,
                                      "Nothing to claim!");
    require(block.timestamp >= users[msg.sender].nextUnlockDate,
                                      "Tokens are still locked!");
    users[msg.sender].isLocked = false;
    _;
  }

  // @notice                            checks if round is active
  modifier                              ifActive() {
    if ((block.timestamp < ROUND_START_DATE) || (block.timestamp > ROUND_END_DATE) || availableTreasury == 0) {
      isActive = false;
      revert("Round is not active!");
    }
    isActive = true;
    _;
  }

  // @notice                            checks if round is inactive
  modifier                              ifInactive() {
    if (block.timestamp <= ROUND_END_DATE && availableTreasury > 0) {
      isActive = true;
      revert("Round is still active!");
    }
    isActive = false;
    _;
  }




  // -------------------------------------------------------------------------------------------------------
  // ------------------------------- ICO logic
  // -------------------------------------------------------------------------------------------------------

  // @notice                            checks if tokens are unlocked and transfers 10% from pendingForClaim
  //                                    user will recieve all remaining tokens with the last (9th) claim
  function                              claimTokens() public checkLock() {
    address                             user = msg.sender;
    User  storage                       userStruct = users[user];
    uint256                             amountToClaim; // 10%

    require(userStruct.isLocked == false, "Tokens are locked!");
    if (userStruct.numUnlocks < 10) { // number of claims to perform
      amountToClaim = ((userStruct.totalTERZBalance - userStruct.initialPayout) / 10000) * 1000; // 10%
    }
    else if (userStruct.numUnlocks == 10) { // number of claims to perform
      amountToClaim = userStruct.pendingForClaim;
    }
    else {
      revert("Everything is already claimed!");
    }
    userStruct.isLocked = true;
    TERZ.mint(user, amountToClaim);
    userStruct.liquidBalance += amountToClaim;
    userStruct.pendingForClaim -= amountToClaim;
    userStruct.nextUnlockDate += LOCK_PERIOD;
    userStruct.numUnlocks += 1;

    emit TERZClaimed(user,
                     amountToClaim,
                     10 - userStruct.numUnlocks, // number of claims left to perform
                     userStruct.nextUnlockDate);
  }

  // @notice                            allows to purchase TERZ tokens
  // @param                             [uint256] _amount => amount of TERZ tokens to purchase
  function                              buyTokens(uint256 _amount) public areTokensAvailable(_amount) ifActive {
    address                             user = msg.sender;
    uint256                             priceUSDT = _amount / 1000 * TERZ_PRICE_USDT;

    require(USDT.balanceOf(user) >= priceUSDT, "Not enough USDT tokens!");
    require(USDT.transferFrom(user, address(this), priceUSDT) == true, "Failed to transfer USDT!");
    _lockAndDistribute(_amount);
    emit TERZPurchased(msg.sender, _amount);
  }

  // @notice                            when user buys TERZ, 10% is issued immediately
  //                                    remaining tokens are locked for 6 * LOCK_PERIOD = 18 months
  // @param                             [uint256] amount => amount of TERZ tokens to distribute
  function                              _lockAndDistribute(uint256 amount) private {
    address                             user = msg.sender;
    User  storage                       userStruct = users[user];
    uint256                             timestampNow = block.timestamp;
    uint256                             immediateAmount = (amount / 10000) * 1000;  // 10%

    TERZ.mint(user, immediateAmount);                                     // issue 10% immediately
    if (users[user].totalTERZBalance == 0) {
      icoTokenHolders.push(user);
    }
    userStruct.initialPayout += immediateAmount;
    userStruct.totalTERZBalance += amount;
    availableTreasury -= amount;
    userStruct.liquidBalance += immediateAmount;                          // issue 10% immediately to struct
    userStruct.pendingForClaim += amount - immediateAmount;               // save the rest
    userStruct.nextUnlockDate = timestampNow + LOCK_PERIOD;               // lock for 10 months
    userStruct.isLocked = true;
    userStruct.numUnlocks = 0;
  }




  // -------------------------------------------------------------------------------------------------------
  // ------------------------------- Admin
  // -------------------------------------------------------------------------------------------------------

  // @notice                            allows to withdraw raised funds (USDT)
  // @param                             [address] _reciever => wallet to send tokens to
  function                              withdrawRaisedFunds(address _reciever) public onlyOwner {
    uint256                             balance = USDT.balanceOf(address(this));

    USDT.transfer(_reciever, balance);
  }

  // @notice                            allows to withdraw TERZ remaining after the round end
  // @param                             [address] _reciever => wallet to send tokens to
  function                              withdrawRemainingTERZ(address _reciever) public onlyOwner ifInactive {
    TERZ.transfer(_reciever, availableTreasury);
    availableTreasury = 0;
  }

  // @notice                            checks if round still active
  function                              checkIfActive() public returns(bool) {
    if ((block.timestamp <= ROUND_START_DATE) || (block.timestamp >= ROUND_END_DATE) || availableTreasury == 0) {
      isActive = false;
    }
    if (block.timestamp > ROUND_START_DATE && block.timestamp < ROUND_END_DATE && availableTreasury > 0) {
      isActive = true;
    }
    return(isActive);
  }
}
