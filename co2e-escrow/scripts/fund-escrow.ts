import * as anchor from "@coral-xyz/anchor";
import {
  PublicKey,
  Transaction,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createTransferInstruction,
  getAccount,
} from "@solana/spl-token";
import * as fs from "fs";

// Configuration
const TOKEN_MINT = new PublicKey("C9vBPNUk9ENVo5iEPY6LwBVoyNTGxZ7jU4uuqjGQde7D");
const PROGRAM_ID = new PublicKey("FsqvhRRiENRHLncK3GKMitZT1V126pXGpT2dtVEHhMkf");

// Amount to transfer: 500,000 CO₂e (half of 1,000,000)
// With 2 decimals: 500,000 * 100 = 50,000,000
const TRANSFER_AMOUNT = BigInt(50_000_000);

async function main() {
  console.log("💸 Funding Escrow with CO₂e tokens...\n");

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

  console.log("👤 Your Wallet:", wallet.publicKey.toString());
  console.log("🪙 Token Mint:", TOKEN_MINT.toString());

  // Derive escrow PDA
  const [escrowPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("escrow"), TOKEN_MINT.toBuffer()],
    PROGRAM_ID
  );
  console.log("\n📦 Escrow PDA:", escrowPDA.toString());

  // Get token accounts
  const yourTokenAccount = await getAssociatedTokenAddress(
    TOKEN_MINT,
    wallet.publicKey
  );
  const escrowTokenAccount = await getAssociatedTokenAddress(
    TOKEN_MINT,
    escrowPDA,
    true
  );

  console.log("\n💰 Token Accounts:");
  console.log("  Your account:", yourTokenAccount.toString());
  console.log("  Escrow account:", escrowTokenAccount.toString());

  // Check balances before
  const yourBalance = await getAccount(connection, yourTokenAccount);
  const escrowBalance = await getAccount(connection, escrowTokenAccount);

  console.log("\n📊 Balances Before:");
  console.log("  Your balance:", Number(yourBalance.amount) / 100, "CO₂e");
  console.log("  Escrow balance:", Number(escrowBalance.amount) / 100, "CO₂e");

  console.log("\n💸 Transferring:", Number(TRANSFER_AMOUNT) / 100, "CO₂e");
  console.log("   (500,000 tokens = half of supply)");

  // Create transfer instruction
  const transferIx = createTransferInstruction(
    yourTokenAccount,
    escrowTokenAccount,
    wallet.publicKey,
    TRANSFER_AMOUNT,
    [],
    TOKEN_PROGRAM_ID
  );

  // Create and send transaction
  const tx = new Transaction().add(transferIx);
  
  console.log("\n📤 Sending transaction...");
  const signature = await provider.sendAndConfirm(tx);

  console.log("\n✅ Transfer complete!");
  console.log("Transaction:", signature);
  console.log(
    "View on Solscan:",
    `https://solscan.io/tx/${signature}?cluster=devnet`
  );

  // Check balances after
  const yourBalanceAfter = await getAccount(connection, yourTokenAccount);
  const escrowBalanceAfter = await getAccount(connection, escrowTokenAccount);

  console.log("\n📊 Balances After:");
  console.log(
    "  Your balance:",
    Number(yourBalanceAfter.amount) / 100,
    "CO₂e"
  );
  console.log(
    "  Escrow balance:",
    Number(escrowBalanceAfter.amount) / 100,
    "CO₂e"
  );

  console.log("\n🎉 Escrow is now funded and ready for purchases!");
  console.log("\n💡 Next steps:");
  console.log("  1. Users can now buy tokens from the escrow");
  console.log("  2. SOL revenue will go to:", wallet.publicKey.toString());
  console.log("  3. You can update the admin to multi-sig later if needed");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
