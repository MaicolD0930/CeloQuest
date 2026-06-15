/**
 * Sync NFT images from NFTS/ into public/nft-assets/images/ and refresh metadata JSON.
 * Run: node scripts/sync-nft-assets.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SRC = path.join(ROOT, "NFTS");
const IMG = path.join(ROOT, "public", "nft-assets", "images");
const META = path.join(ROOT, "public", "nft-assets", "metadata");

const TOKEN_MAP = {
  1: { file: "wallet_connected.png", name: "CeloQuest First Wallet", description: "Created your Web3 identity on CeloQuest", category: "Onboarding" },
  2: { file: "first_challenge.png", name: "CeloQuest First Challenge", description: "Completed your first daily challenge", category: "Learning" },
  3: { file: "streak_3.png", name: "CeloQuest 3 Day Streak", description: "Played 3 days in a row", category: "Streak" },
  4: { file: "streak_7.png", name: "CeloQuest 7 Day Streak", description: "Played 7 days in a row", category: "Streak" },
  5: { file: "tier_celo_explorer.png", name: "CeloQuest Celo Explorer", description: "Reached Celo Explorer tier", category: "Level" },
  6: { file: "weekly_champion.png", name: "CeloQuest Weekly Champion", description: "First place in the weekly season", category: "Competition" },
  7: { file: "second_place.png", name: "CeloQuest Second Place", description: "Second place in the weekly season", category: "Competition" },
  8: { file: "third_place.png", name: "CeloQuest Third Place", description: "Third place in the weekly season", category: "Competition" },
};

const BADGE_COPIES = [
  ["tier_blockchain_user.png", "tier_blockchain_user.png"],
  ["explorer.png", "first_celo_learning.png"],
];

if (!fs.existsSync(SRC)) {
  console.error("NFTS/ folder not found");
  process.exit(1);
}

fs.mkdirSync(IMG, { recursive: true });
fs.mkdirSync(META, { recursive: true });

const baseUrl = (
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

for (const [id, def] of Object.entries(TOKEN_MAP)) {
  const srcFile = path.join(SRC, def.file);
  const destFile = path.join(IMG, `${id}.png`);
  if (!fs.existsSync(srcFile)) {
    console.warn(`Skip ${id}: missing ${def.file}`);
    continue;
  }
  fs.copyFileSync(srcFile, destFile);
  const imagePath = `/nft-assets/images/${id}.png`;
  const metadata = {
    name: def.name,
    description: def.description,
    image: `${baseUrl}${imagePath}`,
    attributes: [
      { trait_type: "Collection", value: "CeloQuest" },
      { trait_type: "Category", value: def.category },
    ],
  };
  fs.writeFileSync(
    path.join(META, `${id}.json`),
    JSON.stringify(metadata, null, 2) + "\n"
  );
  console.log(`✓ Token ${id}: ${def.file}`);
}

for (const [srcName, destName] of BADGE_COPIES) {
  const srcFile = path.join(SRC, srcName);
  if (fs.existsSync(srcFile)) {
    fs.copyFileSync(srcFile, path.join(IMG, destName));
    console.log(`✓ Badge: ${destName}`);
  }
}

console.log("\nDone. Metadata uses image URLs with base:", baseUrl);
