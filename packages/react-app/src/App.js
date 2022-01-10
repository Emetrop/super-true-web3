import { Contract } from "@ethersproject/contracts";
import React, { useEffect, useState } from "react";

import { Body, Button, Header, Image } from "./components";
import logo from "./ethereumLogo.png";
import useWeb3Modal from "./hooks/useWeb3Modal";

import { addresses, abis } from "@project/contracts";

async function createArtist({ provider, instagram, name }) {
  // creating connection to the smart contract
  const forwardCreator = new Contract(addresses.forwardCreator, abis.forwardCreator, provider.getSigner());

  // calling the smart contract function
  const tx = await forwardCreator.createArtist(name, instagram);

  // wait till the transaction is mint/confirmed
  const receipt = await tx.wait();

  return { tx, receipt };
}


async function mint({ provider, contractAddress }) {
  // creating connection to the smart contract
  const forwardNFT = new Contract(contractAddress, abis.forwardNFT, provider.getSigner());

  // get connected metamask wallet address
  const address = await provider.getSigner().getAddress();

  // just debug for you
  console.log({ address })

  // the price is slowly increasing with each NFT so we need to get current price
  const value = await forwardNFT.getCurrentPrice();

  // calling the smart contract function
  // first param is amount of NFTs, second is address where it should be mint into
  const tx = await forwardNFT.mint(1, address, { value });

  // wait till the transaction is mint/confirmed
  const receipt = await tx.wait();

  return { tx, receipt };
}

function WalletButton({ provider, loadWeb3Modal, logoutOfWeb3Modal }) {
  const [account, setAccount] = useState("");
  const [rendered, setRendered] = useState("");

  useEffect(() => {
    async function fetchAccount() {
      try {
        if (!provider) {
          return;
        }

        // Load the user's accounts.
        const accounts = await provider.listAccounts();
        setAccount(accounts[0]);

        // Resolve the ENS name for the first account.
        const name = await provider.lookupAddress(accounts[0]);

        // Render either the ENS name or the shortened account address.
        if (name) {
          setRendered(name);
        } else {
          setRendered(account.substring(0, 6) + "..." + account.substring(36));
        }
      } catch (err) {
        setAccount("");
        setRendered("");
        console.error(err);
      }
    }
    fetchAccount();
  }, [account, provider, setAccount, setRendered]);

  return (
    <Button
      onClick={() => {
        if (!provider) {
          loadWeb3Modal();
        } else {
          logoutOfWeb3Modal();
        }
      }}
    >
      {rendered === "" && "Connect Wallet"}
      {rendered !== "" && rendered}
    </Button>
  );
}

function App() {
  const [provider, loadWeb3Modal, logoutOfWeb3Modal] = useWeb3Modal();
  const [NFTContract, setNFTContract] = useState(null);

  // TODO load from text inputs
  const instagram = "eminem";
  const name = "eminem";

  const create = async () => {
    // TODO check if `instagram` already doesn't exist in our DB and fail if exists

    // TODO show loading state

    const { receipt, tx } = await createArtist({ provider, instagram, name })
      // .catch() // TODO handle errors

    // just for you to see what it returns
    console.log({ receipt, tx });

    // TODO receipt.transactionHash is needed to send to the POST /artist
    // await axios...

    // in this log is always address of the new artist NFT contract
    setNFTContract(receipt.logs[0].address);
  }

  return (
    <div>
      <Header>
        <WalletButton provider={provider} loadWeb3Modal={loadWeb3Modal} logoutOfWeb3Modal={logoutOfWeb3Modal} />
      </Header>
      <Body>
        <Image src={logo} alt="react-logo" />
        <Button onClick={create}>
          Create Artist
        </Button>
        {NFTContract && (
          <Button onClick={() => mint({ provider, contractAddress: NFTContract })}>
            Mint NFT
          </Button>
        )}
      </Body>
    </div>
  );
}

export default App;
