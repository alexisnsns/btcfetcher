const axios = require("axios");

const walletAddress = "bc1qptqnrh6jkwyjm53z2gy08vcy0fzmch66d90lug";
const balanceApiUrl = `https://api.blockcypher.com/v1/btc/main/addrs/${walletAddress}/balance`;
const priceApiUrl =
  "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,eur";

let lastBalanceInSats = null;

const checkBalance = () => {
  axios
    .get(balanceApiUrl)
    .then((balanceResponse) => {
      const currentBalanceInSats = balanceResponse.data.balance;

      console.log("fetching...");

      if (
        lastBalanceInSats !== null &&
        currentBalanceInSats !== lastBalanceInSats
      ) {
        console.log("NEW TRANSACTION DETECTED!");
        process.stdout.write("\x07");
      }

      lastBalanceInSats = currentBalanceInSats;
      const balanceInBTC = currentBalanceInSats / 1e8;

      axios
        .get(priceApiUrl)
        .then((priceResponse) => {
          const btcToUsd = priceResponse.data.bitcoin.usd;
          const btcToEur = priceResponse.data.bitcoin.eur;

          console.log(
            `Wallet balance: ${balanceInBTC} btc (${currentBalanceInSats} sats)`
          );
          console.log(
            `or: ${(balanceInBTC * btcToUsd).toFixed(2)} usd / ${(
              balanceInBTC * btcToEur
            ).toFixed(2)} eur`
          );
        })
        .catch((error) => console.error("Error fetching BTC price:", error));
    })
    .catch((error) => console.error("Error fetching wallet balance:", error));
};
checkBalance();

// Check balance every 25 secs
setInterval(checkBalance, 25000);
