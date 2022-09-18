import { useContractReader } from "eth-hooks";
import { ethers } from "ethers";
import React from "react";
import { Link } from "react-router-dom";

/**
 * web3 props can be passed from '../App.jsx' into your local view component for use
 * @param {*} yourLocalBalance balance on current network
 * @param {*} readContracts contracts from current chain already pre-loaded using ethers contract module. More here https://docs.ethers.io/v5/api/contract/contract/
 * @returns react component
 **/
function Home({ yourLocalBalance, readContracts }) {
  // you can also use hooks locally in your component of choice
  // in this case, let's keep track of 'purpose' variable from our contract
  const purpose = useContractReader(readContracts, "YourContract", "purpose");

  return (
    <div>
      <div style={{ margin: 54 }}>
        <span style={{ marginRight: 8 }}>🌕</span>
        Demo contract interface provided by defimoon
      </div>
      <div style={{ margin: 20 }}>
        <span style={{ marginRight: 8 }}>⚠️</span>
        All input amounts are in WEI by default!
        <div>Press ✴️ to convert to ETH!</div>
      </div>
      <div style={{ margin: 30 }}>
        <span style={{ marginRight: 8 }}>🎓</span>
        Before interacting with round contract:
        <div>⭕ Open Round contract and copy it's address</div>
        <div>⭕ Open USDT contract and fine "approve" field</div>
        <div>⭕ Paste Round address into "spender"</div>
        <div>⭕ Paste 200000000 into "amount"</div>
      </div>
    </div>
  );
}

export default Home;
