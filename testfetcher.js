const axios = require("axios");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function isValidAddress(address) {
  // Regex for P2PKH and P2SH testnet addresses
  const p2pkhOrP2shTestnetRegex = /^[mn2][a-km-zA-HJ-NP-Z1-9]{26,34}$/;
  // Regex for Bech32 testnet addresses
  const bech32TestnetRegex = /^tb1[a-z0-9]{39,59}$/;

  return (
    p2pkhOrP2shTestnetRegex.test(address) || bech32TestnetRegex.test(address)
  );
}

function askForWalletAddress() {
  rl.question("Please enter your wallet address:\n>", function (walletAddress) {
    if (isValidAddress(walletAddress)) {
      fetchBalance(walletAddress);
    } else {
      console.log("Invalid wallet address. Please try again.");
      askForWalletAddress();
    }
  });
}

function fetchBalance(walletAddress) {
  const balanceApiUrl = `https://api.blockcypher.com/v1/btc/test3/addrs/${walletAddress}/balance`;
  const priceApiUrl =
    "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,eur";

  let lastBalanceInSats = null;
  let initialFetchDone = false;

  const checkBalance = () => {
    axios
      .get(balanceApiUrl)
      .then((balanceResponse) => {
        const currentBalanceInSats = balanceResponse.data.balance;

        if (
          !initialFetchDone ||
          (lastBalanceInSats !== null &&
            currentBalanceInSats !== lastBalanceInSats)
        ) {
          initialFetchDone = true;

          if (
            lastBalanceInSats !== null &&
            currentBalanceInSats !== lastBalanceInSats
          ) {
            console.log("NEW TRANSACTION DETECTED!");
            // Make some noise
            process.stdout.write("\x07");
          }

          const balanceInBTC = currentBalanceInSats / 1e8;

          axios
            .get(priceApiUrl)
            .then((priceResponse) => {
              const btcToUsd = priceResponse.data.bitcoin.usd;
              const btcToEur = priceResponse.data.bitcoin.eur;

              console.log(
                `Wallet balance: ${balanceInBTC} BTC (${currentBalanceInSats} sats)`
              );
              console.log(
                `Equivalent to: ${(balanceInBTC * btcToUsd).toFixed(
                  2
                )} USD / ${(balanceInBTC * btcToEur).toFixed(2)} EUR`
              );
              console.log(
                "Monitoring for new transactions. You will be notified when a new transaction is incoming..."
              );
            })
            .catch((error) =>
              console.error("Error fetching BTC price:", error)
            );
        }

        lastBalanceInSats = currentBalanceInSats;
      })
      .catch((error) => console.error("Error fetching wallet balance:", error));
  };

  checkBalance();
  setInterval(checkBalance, 25000); // Check balance every 25 secs
}

askForWalletAddress();
