import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const deployerKey = process.env.DEPLOYER_PRIVATE_KEY;

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./contracts/test",
    cache: "./contracts/cache",
    artifacts: "./contracts/artifacts",
  },
  networks: {
    celoSepolia: {
      url:
        process.env.CELO_SEPOLIA_RPC_URL ??
        "https://forno.celo-sepolia.celo-testnet.org",
      chainId: 11142220,
      accounts: deployerKey ? [deployerKey] : [],
    },
  },
};

export default config;
