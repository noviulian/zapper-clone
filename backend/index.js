const express = require("express");
const cors = require("cors");
const Moralis = require("moralis").default;
const dotenv = require("dotenv");
dotenv.config();

const apiKey = process.env.MORALIS_API_KEY;

const app = express();
const port = 8080;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Hello World!");
});

//GET AMOUNT AND VALUE OF ERC20 TOKENS

//GET AMOUNT AND VALUE OF NATIVE TOKENS

app.get("/nativeBalance", async (req, res) => {
    if (!Moralis.Core.isStarted) {
        await Moralis.start({ apiKey: process.env.MORALIS_API_KEY });
    }

    try {
        const { address, chain } = req.query;

        const response = await Moralis.EvmApi.balance.getNativeBalance({
            address: address,
            chain: chain,
        });

        const nativeBalance = response.raw;

        let nativeCurrency;
        if (chain === "0x1") {
            nativeCurrency = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
        } else if (chain === "0x89") {
            nativeCurrency = "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270";
        }

        const nativePrice = await Moralis.EvmApi.token.getTokenPrice({
            address: nativeCurrency, //WETH Contract
            chain: chain,
        });
        console.log(nativePrice);

        nativeBalance.usd = nativePrice.raw.usdPrice;

        res.send(nativeBalance);
    } catch (e) {
        res.send(e);
    }
});

//GET AMOUNT AND VALUE OF ERC20 TOKENS

async function getWalletTokenBalancesPrice(walletAddress, chain = "eth") {
    const url = `https://deep-index.moralis.io/api/v2.2/wallets/${walletAddress}/tokens?chain=${chain}&exclude_spam=true`;

    const response = await fetch(url, {
        method: "GET",
        headers: {
            accept: "application/json",
            "X-API-Key": apiKey,
        },
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
}

app.get("/tokenBalances", async (req, res) => {
    if (!Moralis.Core.isStarted) {
        await Moralis.start({ apiKey: process.env.MORALIS_API_KEY });
    }

    try {
        const { address, chain } = req.query;

        const response = await getWalletTokenBalancesPrice(address, chain);

        console.log(response);

        res.send(response.result);
    } catch (e) {
        res.send(e);
    }
});

//GET Users NFT's

app.get("/nftBalance", async (req, res) => {
    if (!Moralis.Core.isStarted) {
        await Moralis.start({ apiKey: process.env.MORALIS_API_KEY });
    }

    try {
        const { address, chain } = req.query;

        const response = await Moralis.EvmApi.nft.getWalletNFTs({
            excludeSpam: true,
            address: address,
            chain: chain,
        });

        const userNFTs = response.raw.result;

        res.send(userNFTs);
    } catch (e) {
        res.send(e);
    }
});

//GET USERS TOKEN TRANSFERS

app.get("/tokenTransfers", async (req, res) => {
    if (!Moralis.Core.isStarted) {
        await Moralis.start({ apiKey: process.env.MORALIS_API_KEY });
    }

    try {
        const { address, chain } = req.query;

        const response = await Moralis.EvmApi.token.getWalletTokenTransfers({
            address: address,
            chain: chain,
        });

        const userTrans = response.raw.result;
        userTrans[0].token_symbol;

        let userTransDetails = [];

        for (let i = 0; i < userTrans.length; i++) {
            try {
                const metaResponse =
                    await Moralis.EvmApi.token.getTokenMetadata({
                        addresses: [userTrans[i].address],
                        chain: chain,
                    });

                const response = metaResponse.raw;
                if (response.length > 0) {
                    userTrans[i].token_decimals = response[0].decimals;
                    userTrans[i].token_symbol = response[0].symbol;
                    userTransDetails.push(userTrans[i]);
                } else {
                    console.log("no details for coin");
                }
            } catch (e) {
                console.log(e);
            }
        }

        res.send(userTransDetails);
    } catch (e) {
        res.send(e);
    }
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
