import React, {useEffect, useState} from "react";
import { ethers } from "ethers";
import './App.css';
import abi from './utils/WavePortal.json';

export default function App() {
  /*
    * Just a state variable we use to store our user's public wallet.
    */
  const [currentAccount, setCurrentAccount] = useState("");
  const [allWaves, setAllWaves] = useState([]);
  const [message, setMessage] = useState('');

  /**
   * Create a variable here that holds the contract address after you deploy!
   */
   const contractAddress = '0x7aF18FF875Db809aF6d17D70718D52bf101d73c7';

   const contractABI = abi.abi;
    
  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;
      
      if (!ethereum) {
        console.log("Make sure you have metamask!");
        return;
      } else {
        console.log("We have the ethereum object", ethereum);
      }
      
      /*
      * Check if we're authorized to access the user's wallet
      */
      const accounts = await ethereum.request({ method: 'eth_accounts' });
      
      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account);
        getAllWaves();
      } else {
        console.log("No authorized account found")
      }
    } catch (error) {
      console.log(error);
    }
  }

  /**
  * Implement your connectWallet method here
  */
   const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({ method: "eth_requestAccounts" });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]); 
      
    } catch (error) {
      console.log(error)
    }
  }

    /*
   * Create a method that gets all waves from your contract
   */
    const getAllWaves = async () => {
      const { ethereum } = window;
      try {
        if (ethereum) {
          const provider = new ethers.providers.Web3Provider(ethereum);
          const signer = provider.getSigner();
          const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
          //Call the getAllWaves method from your Smart Contract
          const waves = await wavePortalContract.getAllWaves();
          
  
          // We only need address, timestamp, and message in our UI so let's pick those out
          const wavesCleaned = waves.map(wave => {
            return {
              address: wave.waver,
              timestamp: new Date(wave.timestamp * 1000),
              message: wave.message,
            };
          });
          // Store our data in React State
          setAllWaves(wavesCleaned);
  
        } else {
          console.log("Ethereum object doesn't exist!")
        }
      } catch (error) {
        console.log(error);
      }
    }
  
    const wave = async () => {
      try {
        const { ethereum } = window;
  
        if (ethereum) {
          const provider = new ethers.providers.Web3Provider(ethereum);
          const signer = provider.getSigner();
          const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
  
          let count = await wavePortalContract.getTotalWaves();
          console.log("Retrieved total wave count...", count.toNumber());
          console.log(message);
          /*
          * Execute the actual wave from your smart contract with setting up the gas limit
          */
          const waveTxn = await wavePortalContract.wave(message, { gasLimit: 300000 });
          setMessage('');
          console.log("Mining...", waveTxn.hash);
  
          await waveTxn.wait();
          console.log("Mined -- ", waveTxn.hash);
  
          count = await wavePortalContract.getTotalWaves();
          console.log("Retrieved total wave count...", count.toNumber());
        } else {
          console.log("Ethereum object doesn't exist!");
        }
      } catch (error) {
        console.log(error)
      }
  }
  
    useEffect(()=>{
      checkIfWalletIsConnected();
      // eslint-disable-next-line
    },[]);
  
    useEffect(() => {
      let wavePortalContract;
  
      const onNewWave = (from, timestamp, message) => {
        console.log('NewWave', from, timestamp, message);
        setAllWaves(prevState => [
          ...prevState,
          {
            address: from,
            timestamp: new Date(timestamp * 1000),
            message: message,
          },
        ]);
      };
  
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
  
        wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
        wavePortalContract.on('NewWave', onNewWave);
      }
  
      return () => {
        if (wavePortalContract) {
          wavePortalContract.off('NewWave', onNewWave);
        }
      };
      // eslint-disable-next-line
    }, []);
  
  return (
    <div className="mainContainer">

      <div className="dataContainer">
        <div className="header">
        Hey there!
        </div>

        <div className="bio">
        I am @terrykon and I work at a blockchain technology company. But I am a frontend developer and this is my first experience with blockchain. Connect your Ethereum wallet and wave at me!
        </div>

        
        {currentAccount && (
          <>
            <button className="waveButton" onClick={wave}>
              Send me a wave
            </button>

            <div className="waveText">
              <textarea type="text" name="message" rows="4" cols="74" onChange={event => setMessage(event.target.value)}></textarea>
            </div>

            {allWaves.map((wave, index) => {
              return (
                <div key={index} style={{ backgroundColor: "OldLace", marginTop: "16px", padding: "8px" }}>
                  <div>Address: {wave.address}</div>
                  <div>Time: {wave.timestamp.toString()}</div>
                  <div>Message: {wave.message}</div>
                </div>)
            })}
            </>
        )}

        {/*
        * If there is no currentAccount render this button
        */}
        {!currentAccount && (
          <button className="waveButton" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}


      </div>
    </div>
  );
}
