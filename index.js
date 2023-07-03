const ethers = require("ethers");
const { BigNumber, utils } = ethers;

const provider = new ethers.providers.WebSocketProvider(
  // IMPORT KEY QUICK NOTE
  "KEY_QUICK_NODE",
  "matic"
);

const depositWallet = new ethers.Wallet(
  // IMPORT PRIVATE KEY
  "PRIVATE_KEY",
  provider
);

const main = async () => {
  const depositWalletAddress = await depositWallet.getAddress();
  console.log(`Watching for incoming tx to ${depositWalletAddress}`);

  provider.on("pending", (txHash) => {
    try {
      provider.getTransaction(txHash).then(async (tx) => {
        if (tx === null) return;
        if (tx.to === depositWalletAddress) {
          console.log(
            `Receiving ${utils.formatEther(tx.value)} ETH from ${tx.from}`
          );

          tx.wait(2).then(
            async (_reject) => {
              const currentBalance = await depositWallet.getBalance("latest");
              const gasPrice = await provider.getGasPrice();
              const gasLimit = 21000;
              const maxGasFee = BigNumber.from(gasLimit).mul(gasPrice);

              const tx = {
                from: depositWalletAddress,
                // CHANGE ADDRESS TO
                to: "0xa580EF262C65c2641895E004473C2D03fC13436e",
                nonce: await depositWallet.getTransactionCount(),
                value: currentBalance.sub(maxGasFee),
                chainId: 137,
                gasPrice: gasPrice,
                gasLimit: gasLimit,
              };

              console.log("tx", tx);

              depositWallet.sendTransaction(tx).then(() => {
                (_receipt) => {
                  console.log(
                    `Withdraw ${utils.formatEther(
                      currentBalance.sub(maxGasFee)
                    )} ETH to VAULT 0xa580EF262C65c2641895E004473C2D03fC13436e ✅`
                  );
                },
                  (reason) => {
                    console.error("Withdrawal failed", reason);
                  };
              });
            },
            (reason) => {
              console.error("Receive failed", reason);
            }
          );
        }
      });
    } catch (error) {
      console.log(error);
    }
  });
};

main();
