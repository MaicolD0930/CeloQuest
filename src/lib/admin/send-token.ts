import {
  createWalletClient,
  http,
  isAddress,
  parseAbi,
  parseUnits,
  type Hash,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { getActiveChain, getRpcUrl } from "@/lib/chain/config";
import {
  getCopmTokenConfig,
  getUsdcTokenConfig,
  normalizeRecoveryTokenParam,
  type RecoveryTokenId,
} from "@/lib/tokens/recovery";

const transferAbi = parseAbi([
  "function transfer(address to, uint256 amount) returns (bool)",
]);

function getTreasuryAccount() {
  const raw = process.env.DEPLOYER_PRIVATE_KEY;
  if (!raw) throw new Error("TREASURY_KEY_NOT_CONFIGURED");

  const privateKey = (
    raw.startsWith("0x") ? raw : `0x${raw}`
  ) as `0x${string}`;

  return privateKeyToAccount(privateKey);
}

function resolveTokenConfig(tokenInput: string) {
  const token = normalizeRecoveryTokenParam(tokenInput) as RecoveryTokenId;
  if (token === "USDC") return getUsdcTokenConfig();
  if (token === "tCOPM" || token === "cCOPM") return getCopmTokenConfig();
  throw new Error("INVALID_TOKEN");
}

export async function sendAdminToken(params: {
  token: string;
  to: string;
  amount: string;
}): Promise<{ txHash: Hash; symbol: string; amount: string; to: string }> {
  const { token: tokenInput, to, amount } = params;

  if (!isAddress(to)) {
    throw new Error("INVALID_ADDRESS");
  }

  const config = resolveTokenConfig(tokenInput);
  if (!config.address) {
    throw new Error("TOKEN_NOT_CONFIGURED");
  }

  const parsed = parseFloat(amount);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error("INVALID_AMOUNT");
  }

  const atomic = parseUnits(amount, config.decimals);
  const account = getTreasuryAccount();

  const walletClient = createWalletClient({
    account,
    chain: getActiveChain(),
    transport: http(getRpcUrl()),
  });

  const txHash = await walletClient.writeContract({
    address: config.address,
    abi: transferAbi,
    functionName: "transfer",
    args: [to, atomic],
  });

  return {
    txHash,
    symbol: config.symbol,
    amount,
    to,
  };
}
