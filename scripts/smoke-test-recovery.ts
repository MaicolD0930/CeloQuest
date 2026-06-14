/**
 * Smoke test: RecoveryPaymentContract + env config on Celo Sepolia.
 * Run: npx tsx scripts/smoke-test-recovery.ts
 */
import "dotenv/config";
import { createPublicClient, http, formatUnits } from "viem";
import { celoSepolia } from "viem/chains";
import { recoveryPaymentAbi } from "../src/lib/contracts/recovery-payment-abi";

const CONTRACT = process.env.RECOVERY_CONTRACT_ADDRESS as `0x${string}` | undefined;
const TCOPM = process.env.TCOPM_ADDRESS as `0x${string}` | undefined;
const USDC = process.env.USDC_ADDRESS as `0x${string}` | undefined;
const TREASURY = process.env.RECOVERY_TREASURY_ADDRESS as `0x${string}` | undefined;
const RPC =
  process.env.CELO_SEPOLIA_RPC_URL ??
  "https://forno.celo-sepolia.celo-testnet.org";

async function main() {
  console.log("=== CeloQuest Recovery Smoke Test ===\n");

  const missing: string[] = [];
  if (!CONTRACT) missing.push("RECOVERY_CONTRACT_ADDRESS");
  if (!TCOPM) missing.push("TCOPM_ADDRESS");
  if (!USDC) missing.push("USDC_ADDRESS");
  if (!TREASURY) missing.push("RECOVERY_TREASURY_ADDRESS");
  if (missing.length) {
    console.error("Missing env:", missing.join(", "));
    process.exit(1);
  }

  console.log("Contract:", CONTRACT);
  console.log("Treasury:", TREASURY);
  console.log("tCOPM:   ", TCOPM);
  console.log("USDC:    ", USDC);
  console.log("RPC:     ", RPC);
  console.log();

  const client = createPublicClient({
    chain: celoSepolia,
    transport: http(RPC),
  });

  const [price, treasury, tcopmAllowed, usdcAllowed, owner] = await Promise.all([
    client.readContract({
      address: CONTRACT!,
      abi: recoveryPaymentAbi,
      functionName: "recoveryPrice",
    }),
    client.readContract({
      address: CONTRACT!,
      abi: recoveryPaymentAbi,
      functionName: "treasury",
    }),
    client.readContract({
      address: CONTRACT!,
      abi: recoveryPaymentAbi,
      functionName: "allowedTokens",
      args: [TCOPM!],
    }),
    client.readContract({
      address: CONTRACT!,
      abi: recoveryPaymentAbi,
      functionName: "allowedTokens",
      args: [USDC!],
    }),
    client.readContract({
      address: CONTRACT!,
      abi: [{ name: "owner", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] }] as const,
      functionName: "owner",
    }),
  ]);

  console.log("On-chain recoveryPrice:", formatUnits(price, 6), "(6 decimals)");
  console.log("On-chain treasury:   ", treasury);
  console.log("tCOPM allowed:       ", tcopmAllowed ? "✓" : "✗");
  console.log("USDC allowed:        ", usdcAllowed ? "✓" : "✗");
  console.log("Contract owner:      ", owner);

  const ok =
    tcopmAllowed &&
    usdcAllowed &&
    treasury.toLowerCase() === TREASURY!.toLowerCase() &&
    price === 100_000n;

  console.log();
  if (ok) {
    console.log("✅ Contract configuration OK — ready to test payments in the app.");
    console.log("\nApp URL: http://localhost:3000");
    console.log("1. Connect wallet (ChefCito / 0x0891...3bd4)");
    console.log("2. Start daily challenge → lose life");
    console.log("3. Dropdown: tCOPM or USDC → Pay");
  } else {
    console.error("❌ Contract configuration mismatch.");
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
