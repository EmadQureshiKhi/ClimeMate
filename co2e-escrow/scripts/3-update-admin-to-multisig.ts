import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import {
  PublicKey,
  SystemProgram,
} from "@solana/web3.js";
import * as fs from "fs";

// Configuration
const PROGRAM_ID = new PublicKey("FsqvhRRiENRHLncK3GKMitZT1V126pXGpT2dtVEHhMkf");
const TOKEN_MINT = new PublicKey("C9vBPNUk9ENVo5iEPY6LwBVoyNTGxZ7jU4uuqjGQde7D");
const MULTISIG = new PublicKey("9N1PSX7VLnBtmAdUj4JNVdWQjZrvi8vHftJPLuRNjLWM");

async function main() {
  console.log("🔄 Updating Escrow Admin to Multi-sig...\n");
  console.log("⚠️  NOTE: The escrow contract doesn't have an update_admin function.");
  console.log("   We need to close the old escrow and create a new one with multi-sig as admin.\n");

  // Set up provider
  const connection = new anchor.web3.Connection(
    "https://api.devnet.solana.com",
    "confirmed"
  );
  
  // Load wallet
  const walletPath = process.env.HOME + "/.config/solana/id.json";
  const walletKeypair = anchor.web3.Keypair.fromSecretKey(
    Buffer.from(JSON.parse(fs.readFileSync(walletPath, "utf-8")))
  );
  const wallet = new anchor.Wallet(walletKeypair);
  
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  anchor.setProvider(provider);

  // Load program IDL
  const idlPath = __dirname + "/../target/idl/co2e_escrow.json";
  const idl = JSON.parse(fs.readFileSync(idlPath, "utf-8"));
  const program = new Program(idl, PROGRAM_ID, provider);

  console.log("Current Admin:", wallet.publicKey.toString());
  console.log("New Admin (Multi-sig):", MULTISIG.toString());

  // Derive escrow PDA
  const [escrowPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("escrow"), TOKEN_MINT.toBuffer()],
    PROGRAM_ID
  );

  console.log("\n📦 Escrow PDA:", escrowPDA.toString());

  // Check current state
  try {
    const escrowAccount: any = await program.account.escrow.fetch(escrowPDA);
    console.log("\n📊 Current Escrow State:");
    console.log("  Admin:", escrowAccount.admin.toString());
    console.log("  Price:", escrowAccount.pricePerToken.toString());
    console.log("  Total Sold:", escrowAccount.totalSold.toString());
    console.log("  Total Revenue:", escrowAccount.totalRevenue.toString());

    if (escrowAccount.admin.toString() === MULTISIG.toString()) {
      console.log("\n✅ Admin is already set to multi-sig!");
      console.log("   No changes needed.");
      return;
    }

    console.log("\n⚠️  SOLUTION:");
    console.log("   The Anchor program doesn't have an update_admin instruction.");
    console.log("   We have two options:");
    console.log("\n   Option 1: Keep current setup (recommended for now)");
    console.log("     - Revenue goes to your wallet");
    console.log("     - You can manually transfer SOL to multi-sig");
    console.log("     - Simpler and already working");
    console.log("\n   Option 2: Add update_admin function to program");
    console.log("     - Requires code change and redeployment");
    console.log("     - Would allow changing admin on-chain");
    console.log("\n   Option 3: Use multi-sig in buy_tokens calls");
    console.log("     - Frontend passes multi-sig as admin account");
    console.log("     - SOL goes directly to multi-sig");
    console.log("     - No contract changes needed!");

    console.log("\n💡 RECOMMENDED: Option 3");
    console.log("   When users buy tokens, pass multi-sig as the 'admin' account.");
    console.log("   The contract will send SOL to whatever address is passed.");
    console.log("   This works with the current deployed contract!");

  } catch (e) {
    console.log("\n❌ Could not fetch escrow account");
    console.log("   Error:", e);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
