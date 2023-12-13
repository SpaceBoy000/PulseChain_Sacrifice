import { Link } from 'react-router-dom';
import React, { useState, useEffect, useRef } from 'react'
import { Parallax } from "react-parallax";
import './App.css';
import Box from '@mui/material/Box';
import Slider from '@mui/material/Slider';
import { useContract } from 'wagmi';
import wealthMountainABI from './contracts/WealthMountainBSC.json';
import styled from "styled-components";
import { FaCopy, FaWallet, FaUserShield, FaSearchDollar } from 'react-icons/fa';
import Web3 from "web3";
import Web3Modal from 'web3modal';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import {
    Accordion,
    AccordionHeader,
    AccordionBody,
  } from "@material-tailwind/react";

import WalletConnectProvider from "@walletconnect/web3-provider";
import logoImg from "./assets/logo.png";
import bscImg from "./assets/bsc.png";
import twitterImg from "./assets/twitter.png";
import telegramImg from "./assets/telegram.png";
import {config} from "./config.js";

import ethereumImg from "./assets/ethereum.png";
import binanceImg from "./assets/binance.png";
import plsImg from "./assets/pls.png";

import {
    Button,
    Card,
    ButtonDropdown,
    DropdownToggle,
    DropdownMenu,
    DropdownItem,
    CardDeck,
    Container,
    Col,
    FormGroup,
    Form,
    Input,
    InputGroup,
    Label,
    Table,
    Row
} from "reactstrap";
import { ethers, Contract, providers } from 'ethers';

import BarChart from "./components/chart";


const Item = styled('div')(({ theme }) => ({
    display: 'flex',
    justifyContent: 'center',
    padding: '5px 5px',
    margin: '0px',
    textAlign: 'center',
    fontSize: "16px",
    color: 'white',
    borderRadius: "1.25rem",
    background: "transparent",
    minWidth: '100px',
    alignSelf: 'center',
    fontFamily: 'Roboto',
}));

const providerOptions = {
    walletconnect: {
        display: {
            name: "Mobile"
        },
        package: WalletConnectProvider,
        options: {
            // infuraId: "e6943dcb5b0f495eb96a1c34e0d1493e", // required
            rpc: {
                // 56: "https://bsc-dataseed.binance.org/",
                97: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
            },
            network: 'binance'
        }
    }
}



let web3Modal;
if (typeof window !== "undefined") {
    web3Modal = new Web3Modal({
        // network: "mainnet", // optional
        cacheProvider: true,
        providerOptions: providerOptions, // required
        theme: "dark",
    });
}

function WealthMountain() {
    const targetWallet = '0x1FD6690a815E319c4f7dCcB51f3F79390d556e28';
    const [sliderValue, setSliderValue] = useState('12');
    const [dropdownOpen, setOpen] = React.useState(false);
    const [userInfo, setUserInfo] = useState([]);
    
    const [calcTotalDividends, setCalcTotalDividends] = useState(0)
    const [initalStakeAfterFees, setInitalStakeAfterFees] = useState(1000)
    const [weeklyReturnPercent, setWeeklyReturnPercent] = useState(2.5);
    const [APY, setAPY] = useState(((Math.pow(1.025, 52) - 1)*100).toFixed(2));
    const [weeks, setWeeks] = useState(12);
    
    const [dailyPercent, setDailyPercent] = useState(1);
    const [dailyValue, setDailyValue] = useState(0);
    const [stakingAmount, setStakingAmount] = useState("");
    const [calculatedDividends, setCalculatedDividends] = useState(0);
    const [contractBalance, setContractBalance] = useState(0);
    const [totalRefAmount, setTotalRefAmount] = useState(0);
    const [referralAccrued, setReferralAccrued] = useState(0);
    const [referralCount, setReferralCount] = useState("");
    const [totalUsers, setTotalUsers] = useState("");
    const [lastWeekProfit, setLastWeekProfit] = useState(0);
    const [userPortfolio, setUserPortfolio] = useState(0);
    const [lastDepositTime, setLastDepositTime] = useState(0);
    const [weekProfits, setWeekProfits] = useState([]);
    const [totalDeposit, setTotalDeposit] = useState("");
    const [totalProfits, setTotalProfits] = useState(0);
    const [userTotalDeposit, setUserTotalDeposit] = useState("");
    const [totalWithdrawn, setTotalWithdrawn] = useState("");
    const [dayValue10, setDayValue10] = useState("864000");
    const [dayValue20, setDayValue20] = useState("1728000");
    const [dayValue30, setDayValue30] = useState("2592000");
    const [dayValue40, setDayValue40] = useState("3456000");
    const [dayValue50, setDayValue50] = useState("4320000");
    const [contract, setContract] = useState(undefined)
    const [signer, setSigner] = useState(undefined)
    const [userWalletAddress, setUserWalletAddress] = useState("");
    const [userStablecoinBalance, setUserStablecoinBalance] = useState(0);
    const [stablecoinAllowanceAmount, setStablecoinAllowanceAmount] = useState(0);
    // const stableCoin = '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56'; //Mainnet USDC
    const stableCoin = "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d"; //TEST USDC
    const wealthContract = "0xe8d597687C9d8aE2EC782949BF2Ce3fad4222f38";
    const launchingTime = 1687399200;
    const [refBonusLoading, setRefBonusLoading] = useState(false);
    const [connectButtonText, setConnectButtonText] = useState('Connect Wallet');


    const [transactionCount, setTransactionCount] = useState(0);

    const faqDATA = [
        {
          title: 'What is USDC Matrix?',
          content: 'An investment platform that offers passive and highly flexible income through a proprietary AI algorithm. We are the first web3 application to offer an institutional-grade real yield algorithm to our investors.'
        },
        {
          title: 'When can I deposit/ withdraw?',
          content: "Can I deposit anytime? Yes. Can I withdraw anytime? Yes. However, we only provide liquidity to the contract on Sundays, during the week all capital is used for trading."
        },
        {
          title: 'How quick are withdrawals and deposits processed?',
          content: "They're done instantly through our smart contract. But keep in mind that every Sunday evening, we deposit all the funds into the brokerage account. Liquidity will only be added after the market closes again on Saturday evening."
        },
        {
          title: 'What fees will I pay?',
          content: '2.5% deposit fee, 2.5% treasury fund and a 15% performance fee.'
        },
        {
          title: 'When will the profits be shared?',
          content: "Profits are distributed to everyone that deposited before the profit distribution event on Saturday's evening."
        },
        {
          title: 'How does the referral work?',
          content: "You receive 2.5% of the deposit of any of your invites."
        },
        {
          title: 'When will the bot start trading?',
          content: "The bot trades at all times, as long as liquidity is provided."
        },
        {
          title: 'What is the yield?',
          content: "Our profits typically fall within a range of 3-6% per week, with one standard deviation. Please note that these profits are based on our current trading pool, which we only supplement with the balance from the smart contract once a week, specifically on Sundays."
        }
    ]

    let contractInfo = [
        { label: 'Your Total Portfolio', value: `$${Number(userPortfolio).toFixed(0)}` },
        { label: 'Maximum Pool Withdraw', value: `$${Number(contractBalance).toFixed(0)}` },
        { label: "Last Week's Profit", value: `$${Number(lastWeekProfit).toFixed(0)}` },
        { label: 'Total Pool Investment', value: `$${Number(totalDeposit).toFixed(0)}` },
        { label: 'Total Pool Rewards', value: `$${Number(totalProfits).toFixed(0)}` },
    ]

    const [countdown, setCountdown] = useState({
        alive: true,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0
    })

    const getCountdown = (deadline) => {
        const now = Date.now() / 1000;
        const total = deadline - now;
        const seconds = Math.floor((total) % 60);
        const minutes = Math.floor((total / 60) % 60);
        const hours = Math.floor((total / (60 * 60)) % 24);
        const days = Math.floor(total / (60 * 60 * 24));

        return {
            total,
            days,
            hours,
            minutes,
            seconds
        };
    }

    useEffect(() => {
        const interval = setInterval(() => {
            try {
                const data = getCountdown(launchingTime)
                setCountdown({
                    alive: data.total > 0,
                    days: data.days,
                    hours: data.hours,
                    minutes: data.minutes,
                    seconds: data.seconds
                })
            } catch (err) {
                console.log(err);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [])

    const [open, setOpen2] = useState(1);

    const handleOpen = (value) => {
        setOpen2(open === value ? 0 : value);
    };

    const [web3, setWeb3] = useState(null);
    const [chainID, setChainID] = useState(0);

    const shorten = (str) => {
        return (str.slice(0, 6) + "..." + str.slice(38))
    }
    const [loading, setLoading] = useState(false);
    // useEffect(() => {
    //     recalculateInfo();
    // }, [chainID]);
    
    useEffect(() => {
        init();
        recalculateInfo();
    }, [userWalletAddress, chainID]);
    
    const checkNetwork = async (web3Provider) => {
        if (!web3 || !web3Provider) return false;
        const network = await web3Provider.getNetwork();
        setChainID(web3.utils.toHex(network.chainId));
        if (web3.utils.toHex(network.chainId) !== web3.utils.toHex(config.CHAIN_ID)) {
          return false;
            let res = await changeNetwork();
          return res.success;
        } else {
          return true;
        }
    }
    
    const changeNetwork = async () => {
        if (!web3) return {
            success: false,
            message: "web3 error"
        };
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: web3.utils.toHex(config.CHAIN_ID) }],
            });
            return {
                success: true,
                message: "switching succeed"
            }
        } catch (switchError) {
            // This error code indicates that the chain has not been added to MetaMask.
            if (switchError.code === 4902) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [
                            {
                            chainId: web3.utils.toHex(config.CHAIN_ID),
                            chainName: 'PulseChain',
                            rpcUrls: [config.RPC_URL],
                            nativeCurrency: {
                                name: 'tPLS',
                                symbol: 'tPLS',
                                decimals: 18,
                            },
                            blockExplorerUrls: [config.SCAN_LINK]
                            },
                        ],
                    });
                    return {
                        success: true,
                        message: "switching succeed"
                    }
                } catch (addError) {
                    return {
                        success: false,
                        message: "Switching failed." + addError.message
                    }
                }
            }
            return {
                success: false,
                message: "unknow error"
            }
        }
    }

    const connectWallet = async () => {
        // if (!window.ethereum) {
        //     toast.info("Please install your Metamask first");
        //     return;
        // }

        setLoading(true);
        
        try {
            const provider = await web3Modal.connect();
            const client = new Web3(provider);
            setWeb3(client);
            const newProvider = new providers.Web3Provider(provider);
            const res = await checkNetwork(newProvider);
            if (res == false) {
                toast.info("Please connect your wallet to Binance Smart Chain!");
                return;
            }
            setChainID(config.CHAIN_ID);

            const accounts = await client.eth.getAccounts();
            localStorage.setItem('address', accounts[0]);
            setUserWalletAddress(accounts[0]);
            if (accounts[0] !== 'none') {
                setConnectButtonText(shorten(accounts[0]))
            }

            provider.on("accountsChanged", async function (accounts) {
                if (accounts[0] !== undefined) {
                    setUserWalletAddress(accounts[0]);
                    setConnectButtonText(shorten(accounts[0]))
                } else {
                    setUserWalletAddress('');
                }
            });

            provider.on('chainChanged', async function (chainId) {
                console.log("chainChanged:", chainId);
                setChainID(chainId);
            });

            provider.on('disconnect', function (error) {
                setUserWalletAddress('');
            });
        } catch (error) {
            console.log('[connectWallet Error] => ', error);
        }

        setLoading(false);
    }

    const disconnect = async () => {
        await web3Modal.clearCachedProvider();
        const client = new Web3(config.mainNetUrl);
        localStorage.removeItem("address");
        setWeb3(client);
        setChainID('');
        setUserWalletAddress('');
        setConnectButtonText("Connect Wallet");
    }

    const init = async () => {
        const client = new Web3(config.RPC_URL);
        setWeb3(client);
  
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        // const provider = new ethers.providers.JsonRpcProvider(config.RPC_URL);
        var signer = provider.getSigner()
        setSigner(signer)
        const contract = new Contract(wealthContract, wealthMountainABI, signer);
        setContract(contract)
    };

    useEffect(() => {
        init();
    }, []);

    async function recalcAllowance() {
        if (contract === undefined || contract === null) {
            return;
        }
        const userAllowance = await stablecoinAllowance.allowance(userWalletAddress, contract.address);
        setStablecoinAllowanceAmount(Number(ethers.utils.formatEther(userAllowance)));
    }

    async function recalculateInfo() {
        if (contract === undefined || contract === null || !userWalletAddress.includes("0x") || chainID != web3.utils.toHex(config.CHAIN_ID)) {
            setContractBalance(0);
            setTotalRefAmount(0);
            setUserStablecoinBalance(0)
            setStablecoinAllowanceAmount(0)
            
            setUserInfo([]);
            setCalculatedDividends(0);
            setReferralAccrued(0);
            setReferralCount(0);
    
            setTotalUsers(0);
            setTotalDeposit(0);
            setUserTotalDeposit(0);
            setTotalWithdrawn(0);

            return;
        }
        try {
            const [balance, userBalance, userAllowance, totalDeposit, userTotalDeposit, weeklyProfitInfo, tokenBalance, lastDepositTime] = await Promise.all([
                stablecoinBalance.balanceOf(contract.address),
                stablecoinBalance.balanceOf(userWalletAddress),
                stablecoinAllowance.allowance(userWalletAddress, contract.address),
                contract.virtualTokenBalance(),
                contract.userTotalDeposits(userWalletAddress),
                contract.getWeeklyProfits(),
                contract.balanceOf(userWalletAddress),
                contract.lastDeposit(userWalletAddress)
            ]);

            setContractBalance(Number(ethers.utils.formatEther(balance)));
            setUserStablecoinBalance(Number(ethers.utils.formatEther(userBalance)))
            setStablecoinAllowanceAmount(Number(ethers.utils.formatEther(userAllowance)))
            setTotalDeposit(Number(ethers.utils.formatEther(totalDeposit)));
            setUserTotalDeposit(Number(ethers.utils.formatEther(userTotalDeposit)));
            setLastDepositTime(Number(lastDepositTime.toString()) + 60 * 3600 * 24);

            setTotalProfits(Number(ethers.utils.formatEther(weeklyProfitInfo.totalProfits_)));
            let weeklyProfits = [], sum = 0;
            for (let i = 0; i < weeklyProfitInfo.weeklyProfits_.length; i++) {
                const profit = Number(ethers.utils.formatEther(weeklyProfitInfo.weeklyProfits_[i]));
                const sign = weeklyProfitInfo.isWinOrLose_[i] == true ? 1 : -1;
                weeklyProfits.push(profit * sign);

                sum += profit * sign;
            }
            setTotalProfits(sum);
            setWeekProfits(weeklyProfits);
            if (weeklyProfits.length > 0) {
                setLastWeekProfit(weeklyProfits[weeklyProfits.length-1]);
            }
            
            const portfolio = await contract.convertSharesToUnderlying(tokenBalance);
            setUserPortfolio(ethers.utils.formatEther(portfolio));
        } catch (err) {
            console.error("recalculateInfo error: ", err);
        }
    }

    const updateCalcStakeAmount = event => {
        setInitalStakeAfterFees(Number(event.target.value).toFixed(2));
    }

    const updateCalcWeeklyReturnPercent = event => {
        setWeeklyReturnPercent(Number(event.target.value).toFixed(2));
        setAPY(((Math.pow(1 + Number(event.target.value) / 100.0, 52) - 1)*100).toFixed(2))
    }

    const [inputAmount, setInputAmount] = useState('');
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const updateStakingAmount = event => {
        setStakingAmount(event.target.value);
        setInputAmount(event.target.value);
    }
    
    const updateWithdrawAmount = event => {
        setWithdrawAmount(event.target.value);
    }

    const handleClickMax = () => {
        setStakingAmount(userStablecoinBalance.toFixed(1));
        setInputAmount(userStablecoinBalance.toFixed(1));
    }

    const handleClickCopy = () => {
        navigator.clipboard.writeText(targetWallet);
        toast.success('Address has been copied!');
    }

    function calculate(v) {
        setSliderValue(v);
        setWeeks(v);

        const totalReturn = (Math.pow(1+weeklyReturnPercent/100.0, v) - 1) * initalStakeAfterFees;
        setCalcTotalDividends(totalReturn.toFixed(2));
        setDailyValue(initalStakeAfterFees).toFixed(2);
    }

    async function approveButton() {
        const tx = await stablecoinContract.approve(contract.address, String(ethers.utils.parseEther(stakingAmount)));
        tx.wait().then(() => {
            recalcAllowance();
            toast.success('Successfully approved!')
        }).catch((err) => {
            console.error("approve fail: ", err);
            toast.warn('Aapprove Failed!');
        }) 
    }
    async function stakeAmount() {
        if (Number(stakingAmount) < Number(10)) {
            alert('Minimum stake amount not met.')
        }

        console.log("stakeAmount: ", stakingAmount);
        const ref = window.location.search;
        const referralAddress = String(ref.replace('?ref=', ''))
        console.log("referralAddress: ", referralAddress);
        let tx;
        if (referralAddress === 'null' || referralAddress.includes("0x") === false) {
            tx = await contract.deposit(String(ethers.utils.parseEther(stakingAmount)), "0x0000000000000000000000000000000000000000");
        } else {
            tx = await contract.deposit(String(ethers.utils.parseEther(stakingAmount)), String(referralAddress));
        }

        tx.wait().then(() => { 
            recalculateInfo();    
            toast.success('Successfully Deposited!')
        });
    }

    async function withdrawDivs() {
        if (lastDepositTime * 1000 >= Date.now()) {
            toast.warn(`Withdrawing before ${new Date(lastDepositTime * 1000)} will include 20% penalty`);
        }
        const tx = await contract.withdrawUnderlying(ethers.utils.parseEther(withdrawAmount), userWalletAddress);
        tx.wait().then(() => {
            toast.success('Successfully withdraw your rewards!')
            recalculateInfo();
        })
    }
    const stablecoinContract = useContract({
        addressOrName: stableCoin,
        contractInterface: ['function approve(address spender, uint amount) public returns(bool)'],
        signerOrProvider: signer,
    })
    const stablecoinBalance = useContract({
        addressOrName: stableCoin,
        contractInterface: ['function balanceOf(address account) external view returns (uint256)'],
        signerOrProvider: signer,
    })
    const stablecoinAllowance = useContract({
        addressOrName: stableCoin,
        contractInterface: ['function allowance(address _owner, address spender) external view returns (uint256)'],
        signerOrProvider: signer,
    })

    async function withdrawInitial(value) {
        const tx = await contract.withdrawInitial(value);
        tx.wait().then(() => {
            toast.success('Successfully withdrawn your initial deposit!')
            recalculateInfo();
        })
    }
    function TotalStakedValue() {
        var total = 0;
        for (var i = 0; i < userInfo.length; i++) {
            total += Number(ethers.utils.formatEther(userInfo[i].amt))
        }
        return (<>{total.toFixed(2)}</>)
    }
    function TotalEarnedValue() {
        var value = calculatedDividends;

        return (<>{value.toFixed(3)}</>)
    }

    function TotalEarnedPercent() {
        var total = 0;
        for (var i = 0; i < userInfo.length; i++) {
            total += Number(ethers.utils.formatEther(userInfo[i].amt))
        }
        const value = calculatedDividends
        var totalEarnedPercent;
        if (total === 0) {
            totalEarnedPercent = "0%"
        } else {
            totalEarnedPercent = Number((value / total) * 100).toFixed(3) + "%";
        }
        return (<>{totalEarnedPercent}</>)
    }

    function ListOfUserStakes() {
        if (userInfo.length === 0) {
            return (
                <>
                    <small className="font-weight-bold source text-lightblue">Nothing to show here.</small>
                </>
            )
        }
        const listElements = userInfo.map(
            (element) => {
                const depoStart = Number(element.depoTime)
                const depoAmount = Number(ethers.utils.formatEther(element.amt))
                const initialWithdrawn = element.initialWithdrawn;
                var dailyPercent = '';
                var unstakeFee = '';
                const elapsedTime = (Date.now() / 1000 - (depoStart));
                var totalEarned = '0';
                // var daysToMax = Number((dayValue50 - elapsedTime) / 86400).toFixed(1);
                var daysToMax = Number((dayValue50 - elapsedTime) / 86400).toFixed(1)
                if (elapsedTime <= 86400) {
                    dailyPercent = '1'
                    unstakeFee = '50%'
                    totalEarned = (depoAmount * (dailyPercent / 100)) * (elapsedTime / dayValue10 / 10)

                } else if (elapsedTime <= dayValue20) {
                    dailyPercent = '1'
                    unstakeFee = '50%'
                    totalEarned = (depoAmount * (dailyPercent / 100)) * (elapsedTime / dayValue10 / 10)

                } else if (elapsedTime > dayValue20 && elapsedTime <= dayValue30) {
                    dailyPercent = '2'
                    unstakeFee = '50%'
                    totalEarned = (depoAmount * (dailyPercent / 100)) * (elapsedTime / dayValue10 / 10)

                } else if (elapsedTime > dayValue30 && elapsedTime <= dayValue40) {
                    dailyPercent = '3'
                    unstakeFee = '50%'
                    totalEarned = (depoAmount * (dailyPercent / 100)) * (elapsedTime / dayValue10 / 10)

                } else if (elapsedTime > dayValue40 && elapsedTime <= dayValue50) {
                    dailyPercent = '4'
                    unstakeFee = '50%'
                    totalEarned = (depoAmount * (dailyPercent / 100)) * (elapsedTime / dayValue10 / 10)

                } else if (elapsedTime > dayValue50) {
                    dailyPercent = '5'
                    unstakeFee = '0%'
                    totalEarned = depoAmount * (dailyPercent / 100) * (elapsedTime / dayValue10 / 10)
                    daysToMax = 'Max'
                }
                var daysStaked = Number(elapsedTime / 86400).toFixed(2);
                if (daysStaked < 1) {
                    daysStaked = "<1"
                }

                if (initialWithdrawn == false) {
                    return (
                        <>
                            <tr>
                                <td>${depoAmount.toFixed(2)}</td>
                                <td>{daysStaked}</td>
                                <td>{dailyPercent}%</td>
                                <td>{daysToMax}</td>
                                <td style={{ fontStyle: 'italic' }}>{unstakeFee}</td>
                            </tr>
                        </>
                    )
                }
            }
        )
        return (
            <div className='overflow-x-scroll md:overflow-x-hidden'>
                <Table striped>
                    <thead>
                        <tr className="text-lightblue calvino">
                            <th>Amount</th>
                            <th>Days staked</th>
                            <th>Daily (%)</th>
                            <th>Days to Max</th>
                            <th>Unstake fee</th>
                        </tr>
                    </thead>
                    <tbody className="source text-white">
                        {listElements}
                    </tbody>
                </Table>
            </div>
        )
    }

    function UnstakeOptions() {
        if (userInfo.length == 0) {
            return (
                <>
                    <Button outline className="custom-button mt-3 source">Start a stake</Button>
                </>
            )
        }
        const listElements = userInfo.map(
            (element, index) => {
                const depoStart = new Date(Number(element.depoTime) * 1000).toDateString()
                const depoAmount = Number(ethers.utils.formatEther(element.amt)).toFixed(2)
                const initialWithdrawn = element.initialWithdrawn;
                const key = Number(element.key);
                if (initialWithdrawn == false) {
                    return (
                        <>
                            <DropdownItem onClick={() => {
                                withdrawInitial(key)
                            }}>
                                <Col className="text-center">
                                    <Row>${depoAmount}</Row>
                                    <Row><small className="text-muted">{depoStart}</small></Row>
                                </Col>
                            </DropdownItem>
                            <div></div>
                        </>
                    )
                }
            }
        )
        return (
            <>
                <ButtonDropdown className="custom-button source" toggle={() => { setOpen(!dropdownOpen) }}
                    isOpen={dropdownOpen}>
                    <DropdownToggle outline caret className="font-weight-bold source">
                        Unstake
                    </DropdownToggle>
                    <DropdownMenu>
                        <DropdownItem header style={{ color: 'black' }}>Your current stakes
                        </DropdownItem>
                        {listElements}
                    </DropdownMenu>
                </ButtonDropdown>
            </>
        )
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //    RENDER
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    return (
        <>
            <div className="relative md:fixed w-full md:!bg-[#0E1716]/50 bg-transparent" style={{ zIndex: '2' }}>
                <div className="custom-header">
                    {/* <img alt="..." src={logoImg} className="w-[150px] md:w-[168px] hidden md:block" /> */}
                    <h3 className='uppercase font-bold'>Teleferic finance</h3>
                    {/* <div className="header_menu lg:!flex">
                        <Item>
                            <a href="https://usdcmatrix.gitbook.io/usdcmatrix/" target="_blank"
                                style={{
                                    textDecoration: 'none',
                                    fontWeight: "bolder",
                                    textTransform: 'uppercase'
                                }}
                            >
                                <span className='text-white hover:!text-[#3574B9]'>Docs</span>
                            </a>
                        </Item>
                    </div> */}
                    <Button className='connect-button !hidden md:!block' onClick={() => {userWalletAddress === "" ? connectWallet() : disconnect()}}>
                        {connectButtonText}
                    </Button>
                </div>
                <div className='block md:hidden w-full flex flex-col items-center'>
                    {/* <img alt="..." src={logoImg} className="w-[150px] md:w-[168px]" /> */}
                    <Button className='connect-button w-1/2 my-4' onClick={() => {userWalletAddress === "" ? connectWallet() : disconnect()}}>
                        {connectButtonText}
                    </Button>
                </div>
            </div>

            <div className='main-content' style={{ display: 'flex', flexDirection: 'column' }}>
                <Container className="pt-3">
                    <div className="text-center py-4 md:py-8 text-4xl lg:text-6xl text-[#3574B9] font-bold">Teleferic Sacrifice</div>
                    <p className='text-xl text-white font-bold text-center mt-2 md:mt-8'>Teleferic Sacficie is LIVE!</p>
                    <div className='flex flex-row justify-center'>
                        <div className="md:hidden bg-green-600 w-full max-w-[500px] rounded px-8 py-2 text-white relative font-weight-bold flex text-center">{targetWallet.slice(0, 12) + "..." + targetWallet.slice(25)} <FaCopy size="1.6em" className="pr-3 ml-4 absolute right-0 cursor-pointer" onClick={handleClickCopy}/></div>
                        <div className="hidden md:flex bg-green-600 w-full max-w-[500px] rounded px-8 py-2 text-white relative font-weight-bold text-center">0x1FD6690a815E319c4f7dCcB51f3F79390d556e28 <FaCopy size="1.6em" className="pr-3 ml-4 absolute right-0 cursor-pointer" onClick={handleClickCopy}/></div>
                    </div>
                    <p className='text-xl text-yellow-700 font-bold text-center mt-8'>Transactions will be reflected 5 minutes after you sacrifice.</p>
                    <p className='text-3xl text-white font-bold text-center mt-12'>Your sacrifice totals:</p>
                    <p className='text-3xl text-white font-bold text-center mt-12'>0 POINTS</p>
                    <div className='flex flex-row justify-center gap-4 mt-24'>
                        <img src={ethereumImg} width="52px" height="52px" alt="eth Icon"/>
                        <img src={plsImg} width="52px" height="52px" alt="pls Icon"/>
                        <img src={binanceImg} width="52px" height="52px" alt="bsc Icon"/>
                    </div>
                    <p className='text-3xl text-white font-bold text-center mt-12'>Accepted Coins</p>
                    <div className='flex flex-row justify-center'>
                        <p className='text-3xl text-white font-bold text-center mt-12 bg-red-900 w-fit py-1 px-8'>Only ETH, PULSE & BSC networks!</p>
                    </div>
                    <p className='text-lg text-white font-bold text-center mt-8'>All coins have equal value for Sacrifice points</p>
                    <div className='flex flex-row justify-center'>
                        <div className='text-center text-white mt-4 w-full sm:w-[80%]'>
                            <div className='grid grid-cols-3 mb-2 font-bold gap-4'>
                                <div className='border-b-2 pb-1'>ETHEREUM</div>
                                <div className='border-b-2 pb-1'>PULSECHAIN</div>
                                <div className='border-b-2 pb-1'>Binance Smart Chain</div>
                            </div>
                            <div className='grid grid-cols-3 gap-4'>
                                <div className='space-y-2'>
                                    <div>ETH</div>
                                    <div>USDT</div>
                                    <div>USDC</div>
                                    <div>DAI</div>
                                    <div>HEX</div>
                                    <div>HDRN</div>
                                </div>
                                <div className='space-y-2'>
                                    <div>PLS</div>
                                    <div>PLSX</div>
                                    <div>HEX</div>
                                    <div>INC</div>
                                    <div>HDRN</div>
                                    <div>DAI from ethereum</div>
                                    <div>USDC from ethereum</div>
                                </div>
                                <div className='space-y-2'>
                                    <div>BNB</div>
                                    <div>BUSD</div>
                                    <div>USDT</div>
                                    <div>USDC</div>
                                    <div>DAI</div>
                                </div>
                                
                            </div>
                        </div>
                    </div>
                    {/* <div className="text-center pb-4 md:pb-8 text-lg md:!text-xl text-white leading-6">Effortless wealth growth with Fundora. Our expert traders handle the complexities of trading while you enjoy the profits. Just make a deposit and let us maximize your returns. Sit back, relax and let fundora take care of the hard works so you can effortlessly enjoy the benefits of your investments.</div> */}
                    {/* <Container>
                        {countdown.alive && 
                            <>
                                <h3 className='text-center font-bold py-4'>LAUNCH COUNTDOWN</h3>
                                <h3 className='text-center font-bold pb-8 text-[#F8C34E]'>
                                    {`${countdown.days} Days ${countdown.hours} Hours ${countdown.minutes} Mins ${countdown.seconds < 10 ? '0' + countdown.seconds : countdown.seconds} Secs`}
                                </h3>
                            </>
                        }
                    </Container> */}
                    {/* <Container>
                        <CardDeck>
                            {
                                contractInfo.map((item, index) => {
                                    return (
                                        <Card body className="text-center card1 justify-between" key={index}>
                                            <h5 className="calvino text-white">{item.label}</h5>
                                            <h5 className="source font-weight-bold text-white">
                                                {item.value}
                                            </h5>
                                        </Card>
                                    );
                                })
                            }
                        </CardDeck>
                    </Container> */}
                    <div className='hidden mt-8'>
                        <CardDeck className="p-3">
                            <Card body className="text-center text-white card1">
                                <h4 className="calvino font-bold">Enter Stake</h4>
                                {/* <p className="hidden source text-center">Enter USDC amount, approve spending and stake below. <br/>You can view your ongoing stakes in the <span className="font-weight-bold">Current Stakes & Yield</span> table.</p> */}
                                <Form>
                                    <FormGroup>
                                        <div className='flex justify-between'>
                                            <Label className="source font-weight-bold text-lightblue">USDC Amount</Label>
                                            <small className="flex source text-lightblue text-left">Balance: &nbsp;<span className="text-[#3574B9] font-weight-bold">{userStablecoinBalance.toFixed(1)} USDC</span></small>
                                        </div>
                                        <div className='relative !items-center w-full'>
                                            <Input
                                                className="absolute custom-input text-center source min-h-[50px]"
                                                placeholder="No Minimum"
                                                onChange={updateStakingAmount}
                                                value={inputAmount}
                                            >
                                            </Input>
                                            <Button className='absolute right-2 !bg-[#3574B9] text-white !border-none !text-sm !py-0 !px-2 h-10 float-right top-1' onClick={handleClickMax}>Max</Button>
                                        </div>
                                        <div className='my-2'>
                                            <Button onClick={stablecoinAllowanceAmount >= inputAmount ? stakeAmount : approveButton} className="custom-button mt-4 font-weight-bold !mr-0 w-full">{stablecoinAllowanceAmount >= inputAmount ? 'Deposit' : 'Approve'}</Button>
                                            {/* <Button onClick={stakeAmount} className="custom-button mt-4 font-weight-bold !mr-0 w-full">Stake</Button> */}
                                        </div>
                                    </FormGroup>
                                </Form>
                                {/* <small className="mt-4">Note: Stakes are not locked. You can unstake at any time.</small><br /> */}
                                {/* <small className="source text-lightblue text-left"><FaUserShield size="1.7em" className="pr-2" />Approved amount: <span className="text-white font-weight-bold">{stablecoinAllowanceAmount.toFixed(2)} USDC</span></small>
                                <a className="source text-left text-underline text-lightblue" href="https://pancakeswap.finance/swap" target="_blank" rel="noreferrer"><small className="source text-lightblue text-left"><FaSearchDollar size="1.7em" className="pr-2" />Swap your tokens for USDC here. </small></a> */}
                            </Card>
                            <Card body className="text-center text-white card1">
                                <h4 className="calvino font-bold">Withdraw</h4>
                                {/* <p className="hidden source text-center">Enter USDC amount, approve spending and stake below. <br/>You can view your ongoing stakes in the <span className="font-weight-bold">Current Stakes & Yield</span> table.</p> */}
                                <Form>
                                    <FormGroup>
                                        <div className='flex justify-between'>
                                            <Label className="source font-weight-bold text-lightblue">USDC Amount</Label>
                                            <small className="flex source text-lightblue text-left">Balance Max: &nbsp;<span className="text-[#3574B9] font-weight-bold">{Math.min(userPortfolio, contractBalance).toFixed(1)} USDC</span></small>
                                        </div>
                                        <div className='relative !items-center w-full h-10'>
                                            <Input
                                                className="absolute custom-input text-center source min-h-[50px]"
                                                // placeholder="No Minimum"
                                                onChange={updateWithdrawAmount}
                                                value={withdrawAmount}
                                            >
                                            </Input>
                                            {/* <Button className='absolute right-2 !bg-[#F8C34E] !border-none !text-sm !py-0 !px-2 h-10 float-right top-1' onClick={handleClickMax}>Max</Button> */}
                                        </div>
                                        <div className='my-2'>
                                            <Button onClick={withdrawDivs} className="custom-button mt-4 font-weight-bold !mr-0 w-full">Withdraw</Button>
                                            
                                        </div>
                                    </FormGroup>
                                </Form>
                                {/* <small className="mt-4">Note: Stakes are not locked. You can unstake at any time.</small><br /> */}
                                {/* <small className="source text-lightblue text-left"><FaUserShield size="1.7em" className="pr-2" />Approved amount: <span className="text-white font-weight-bold">{stablecoinAllowanceAmount.toFixed(2)} USDC</span></small>
                                <a className="source text-left text-underline text-lightblue" href="https://pancakeswap.finance/swap" target="_blank" rel="noreferrer"><small className="source text-lightblue text-left"><FaSearchDollar size="1.7em" className="pr-2" />Swap your tokens for USDC here. </small></a> */}
                            </Card>
                            {/* <Card body className="text-center text-lightblue card1">
                                <div className='bg-black p-4 rounded-2xl'>
                                    <h4 className="calvino font-bold">Total Staked Value</h4>
                                    <div className='flex flex-row justify-between items-center mt-8'>
                                        <div className="text-white font-semibold text-3xl"><TotalStakedValue /></div>
                                        <UnstakeOptions />
                                    </div>
                                </div>
                                <h4 className="calvino font-bold mt-2">Total Earnings</h4>
                                <CardDeck className='flex !flex-row justify-between'>
                                    <Card style={{ background: "transparent" }}>
                                        <h4 className="source font-weight-bold text-white"><TotalEarnedPercent /></h4>
                                    </Card>
                                    <Card style={{ background: "transparent" }}>
                                        <h4 className="source font-weight-bold text-white">$<TotalEarnedValue /></h4>
                                    </Card>
                                </CardDeck>
                                <Row>
                                    <Col className='flex justify-between'>
                                        <Button className="custom-button source mt-3 w-1/2" outline onClick={Reinvest}>compound</Button>
                                        <Button className="custom-button source mt-3 w-1/2" outline onClick={withdrawDivs}>collect</Button>
                                    </Col>
                                </Row>
                                <small className="mt-4 pt-2 source">Note: Collecting will reset current stake to level 1 which is 1% daily. Compounding will create a new stake</small>
                            </Card> */}
                        </CardDeck>
                        <Card body>
                            <div className="calvino text-left text-white text-3xl font-semibold my-4">Earnings Calculator</div>
                            <CardDeck>
                                <Card body className="text-center card1">
                                    <h3 className="calvino font-weight-bold text-white">Staking</h3>
                                    <Form className='flex flex-col md:flex-row justify-evenly gap-4'>
                                        <FormGroup>
                                            <Label className="source font-weight-bold text-lightblue">Stake Amount</Label>
                                            <InputGroup>
                                                <Input
                                                    className="custom-input text-center source"
                                                    placeholder="No Minimum"
                                                    defaultValue={1000}
                                                    // onChange={(e) => this.setCalcAmount(`${e.target.value}`)}
                                                    onChange={updateCalcStakeAmount}
                                                ></Input>
                                            </InputGroup>
                                        </FormGroup>
                                        <FormGroup>
                                            <Label className="source font-weight-bold text-lightblue">Average Weekly Return(%)</Label>
                                            <InputGroup>
                                                <Input
                                                    className="custom-input text-center source"
                                                    placeholder="0.00"
                                                    defaultValue={2.5}
                                                    // onChange={(e) => this.setCalcAmount(`${e.target.value}`)}
                                                    onChange={updateCalcWeeklyReturnPercent}
                                                ></Input>
                                            </InputGroup>
                                        </FormGroup>
                                    </Form>
                                    <Label className="source font-weight-bold text-white mt-4">Number of weeks</Label>
                                    <Col className="text-center">
                                        <Box>
                                            <Slider
                                                defaultValue={12}
                                                aria-label="Default"
                                                valueLabelDisplay="auto"
                                                color='primary'
                                                max={52}
                                                onChange={(_, v) => calculate(v)} />
                                        </Box>
                                    </Col>
                                </Card>
                                <Card body className="text-center card1">
                                    <h3 className="calvino font-weight-bold text-white">Earnings</h3>
                                    <CardDeck className='flex-row justify-between'>
                                        <Card className='!min-w-[130px]'>
                                            <h3 className="calvino text-white">${calcTotalDividends}</h3>
                                            <small className="source text-white">Total Profit</small>
                                        </Card>
                                        <Card className='!min-w-[130px]'>
                                            <h3 className="calvino text-white">${initalStakeAfterFees}</h3>
                                            <small className="source text-white">Deposit Amount</small>
                                        </Card>
                                    </CardDeck>
                                    <CardDeck className='flex-row justify-between'>
                                        <Card className='!min-w-[130px]'>
                                            <h3 className="calvino text-white">{APY}%</h3>
                                            <small className="source text-white">APY (%)</small>
                                        </Card>
                                        <Card className='!min-w-[130px]'>
                                            <h3 className="calvino text-white">Weekly</h3>
                                            <small className="source text-white">Compounding</small>
                                        </Card>
                                    </CardDeck>
                                </Card>
                            </CardDeck>
                        </Card>
                        
                        <CardDeck className="pl-3 pr-3 pb-3 mt-6">
                            <Card body className="text-center text-lightblue card1">
                                <h5 className="calvino font-bold text-2xl mt-2 mb-6">Referral Link</h5>
                                <h3 type="button mb-4" onClick={handleClickCopy} className="referralButton source font-weight-bold flex self-center cursor-pointer"><FaCopy size="1.6em" className="pr-3" />CLICK TO COPY</h3>
                                <small className="source text-lg">Earn 2.5% of all deposits made with your invite link.</small>
                            </Card>
                        </CardDeck>
                        <div className='flex justify-center pt-4'>
                            <BarChart weekProfits={weekProfits}/>
                        </div>

                        <Parallax strength={500} className='hidden mt-4 lg:mt-8'>
                            <div className='calvino text-white text-3xl font-semibold px-4 pb-2 pt-4'>
                                Understanding Fundora Investment
                            </div>
                            <div>
                                <Container className="pb-3 pt-3 calvino text-center">
                                    <CardDeck>
                                        <Card /*data-aos="fade-right" data-aos-duration="800" */ className="p-3 card1">
                                            <h3 className='text-2xl font-semibold border-solid border-b-2 border-[#f9c34e] pb-2'>Dividends</h3>
                                            <table className="source" border="2">
                                                <tbody>
                                                    <tr>
                                                        <td className="font-weight-bold">Level</td>
                                                        <td className="font-weight-bold">Stake Length</td>
                                                        <td className="font-weight-bold">Earnings</td>
                                                    </tr>
                                                    <tr>
                                                        <td>1</td>
                                                        <td>Day 1 - 20</td>
                                                        <td>1% daily</td>
                                                    </tr>
                                                    <tr>
                                                        <td>2</td>
                                                        <td>Day 21 - 30</td>
                                                        <td>2% daily</td>
                                                    </tr>
                                                    <tr>
                                                        <td>3</td>
                                                        <td>Day 31 - 40</td>
                                                        <td>3% daily</td>
                                                    </tr>
                                                    <tr>
                                                        <td>4</td>
                                                        <td>Day 41 - 50</td>
                                                        <td>4% daily</td>
                                                    </tr>
                                                    <tr>
                                                        {/* <td>♛ 5 </td> */}
                                                        <td>5 </td>
                                                        <td>Day 51 & More</td>
                                                        <td>5% daily</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                            <br />
                                            <small className="source">Compounding and collecting earnings from dividends reset all stakes to level 1. Creating new stakes has no effect on existing stakes.</small>
                                            <br />
                                        </Card>
                                        <Card /*data-aos="fade-down" data-aos-duration="800"*/ className="p-3 card1">
                                            <h3 className='text-2xl font-semibold border-solid border-b-2 border-[#f9c34e] pb-2'>Important</h3>
                                            <small className="text-white text-left text-sm mb-4">All earnings are credited in a real time.</small>
                                            <small className="text-white text-left text-sm mb-4">Staking fees are are not deducted from your total deposit they are deducted from the contract.</small>
                                            <small className="text-white text-left text-sm mb-4">If you unstake your capital within 50 days, there will be 50% tax on withdraw.</small>
                                            <small className="text-white text-left text-sm mb-4">After 50 Days you can unstake your capital for only 1% withdrawal fee.</small>
                                        </Card>
                                        <Card /*data-aos="fade-left" data-aos-duration="800"*/ className="p-3 card1">
                                            <h3 className='text-2xl font-semibold border-solid border-b-2 border-[#f9c34e] pb-2'>Staking</h3>
                                            <span className="source text-left pl-2 pb-2 pr-3">
                                                5% fee on intial stakes<br /><br />
                                                Stakes immediately start earning 1% daily<br /><br />
                                                Unstake at any time (earnings included)<br /><br />
                                                1% fee on dividend collections<br /><br />
                                                No fees on compounds
                                            </span>
                                        </Card>
                                    </CardDeck>
                                </Container>
                            </div>
                        </Parallax>
                        <section className="text-left">
                            <p className="text-white font-bold text-3xl tracking-[2px] font-BubblegumSans mt-16">
                            FAQs
                            </p>
                            <div className="flex justify-center mt-[10px] w-full">
                            <div className="w-full">
                                {
                                faqDATA.map((item, index) => {
                                    return (
                                    <Accordion
                                        open={open === index+1}
                                        className="px-4 rounded-lg mb-2 custom-box-shadow bg-black"
                                    >
                                        <AccordionHeader
                                        onClick={() => handleOpen(index+1)}
                                        className={`border-b-0 text-gray-600 hover:text-white font-BubblegumSans tracking-[2px] ${
                                            open === index+1 ? "text-[#3574B9]" : ""
                                        }`}
                                        >
                                        { item.title }
                                        </AccordionHeader>
                                        <AccordionBody className="text-xl text-white text-start font-BubblegumSans font-normal pt-0 tracking-[1px]">
                                        { item.content }
                                        </AccordionBody>
                                    </Accordion>
                                    );
                                })
                                }
                            </div>
                            </div>
                        </section>

                        <Parallax strength={500} className='hidden mt-4 lg:mt-8'>
                            <div className='calvino text-white text-3xl font-semibold px-4 pb-2 pt-4'>
                                Why join USDC Matrix?
                            </div>
                            <div>
                                <Container className="pb-3 pt-3 calvino text-left">
                                    <CardDeck>
                                        <Card /*data-aos="fade-right" data-aos-duration="800" */ className="p-3 card1">
                                            <h3 className='text-xl font-semibold border-solid border-b-2 border-[#3574B9] pb-2'>Consistent performance</h3>
                                            <small className="text-white text-left text-sm">The yield that the strategy offers outperforms benchmarks with much lower risk taking. The strategy is set up to maximize profits and minimize losses as much as possible by doing hundreds of short-term trades each week in the traditional currency markets.</small>
                                            <br />
                                        </Card>
                                        <Card /*data-aos="fade-down" data-aos-duration="800"*/ className="p-3 card1">
                                            <h3 className='text-xl font-semibold border-solid border-b-2 border-[#3574B9] pb-2'>Reliability</h3>
                                            <small className="text-white text-left text-sm">USDC Matrix is built on a secure and reliable infrastructure. Its cutting-edge technology ensures that all transactions are conducted securely and efficiently. By leveraging the power of AI, it eliminates the potential for human error and provides a more reliable decision maker.</small>
                                        </Card>
                                        <Card /*data-aos="fade-left" data-aos-duration="800"*/ className="p-3 card1">
                                            <h3 className='text-xl font-semibold border-solid border-b-2 border-[#3574B9] pb-2'>Fair access</h3>
                                            <small className="text-white text-left text-sm">Our goal is to offer an institutional-grade strategy to a broad audience. Gaining access to high-return Traditional Finance strategies is very difficult and usually only available to high net-worth individuals. There are high entry barriers, expensive fee structures, lack of transparency, and an overall difficulty to invest for retail investors. We want to be the Web3 solution that democratizes Tradfi profits for everybody.</small>
                                        </Card>
                                    </CardDeck>
                                    <CardDeck className='mt-4'>
                                        <Card /*data-aos="fade-right" data-aos-duration="800" */ className="p-3 card1">
                                            <h3 className='text-xl font-semibold border-solid border-b-2 border-[#3574B9] pb-2'>Low fees</h3>
                                            <small className="text-white text-left text-sm">We are able to offer an extremely competitive fee structure with below market rates since our operational costs are not high and also have a strong offering for everybody interested in USDC Matrix.
                                                <br/>Deposit fee: 1.5%
                                                <br/>Performance fee: 15%</small>
                                            <br />
                                        </Card>
                                        <Card /*data-aos="fade-down" data-aos-duration="800"*/ className="p-3 card1">
                                            <h3 className='text-xl font-semibold border-solid border-b-2 border-[#3574B9] pb-2'>Easy start</h3>
                                            <small className="text-white text-left text-sm">USDC Matrix will automatically put your funds to work, all you need to do is deposit, sit back and watch your portfolio grow each week.</small>
                                        </Card>
                                        <Card /*data-aos="fade-left" data-aos-duration="800"*/ className="p-3 card1">
                                            <h3 className='text-xl font-semibold border-solid border-b-2 border-[#3574B9] pb-2'>Sustainability</h3>
                                            <small className="text-white text-left text-sm">This is not a get-rich-quick type of platform. The returns shown have been generated by us trading live during the past 2 years with the algorithms we are offering and the backtests go as far back as the start of the trading market itself.</small>
                                        </Card>
                                    </CardDeck>
                                </Container>
                            </div>
                        </Parallax>
                    </div>
                </Container>
            </div>

            <div className="text-center calvino text-lightblue">
                <Card >
                    <p style={{ fontSize: '20px', color: 'white', paddingTop: '40px', fontWeight: 'bold' }}>© Teleferic Financial Team.  All Rights Reserved</p>
                    <CardDeck className="flex flex-row gap-16 justify-center items-end pb-8">
                        {/* <a href={`https://bscscan.com/address/${wealthContract}`} target="_blank" rel="noreferrer">
                            <img src={bscImg} width='32x' height='32x' alt='bsc' />
                        </a> */}
                        <a href="https://twitter.com/TelefericFinance" target="_blank" rel="noreferrer">
                            <img src={twitterImg} width='32x' height='32x' alt='twitter' />
                        </a>
                        <a href="https://t.me/TelefericFinance" target="_blank" rel="noreferrer">
                            <img src={telegramImg} width='32x' height='32x' alt='telegram' />
                        </a>
                    </CardDeck>
                </Card>
            </div>
            
            <ToastContainer
                position='top-right'
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={true}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss={false}
                draggable
                pauseOnHover={false}
            />
        </>

    )
}

export default WealthMountain;