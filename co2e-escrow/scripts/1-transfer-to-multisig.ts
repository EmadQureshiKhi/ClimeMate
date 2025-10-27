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
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";
import * as fs from "fs";

// Configuration
const TOKEN_MINT = new PublicKey("C9vBPNUk9ENVo5iEPY6LwBVoyNTGxZ7jU4uuqjGQde7D");
const MULTISIG = new PublicKey("9N1PSX7VLnBtmAdUj4JNVdWQjZrvi8vHftJPLuRNjLWM");

// Transfer ALL tokens: 1,000,000 CO₂e
// With 2 decimals: 1,000,000 * 100 = 100,000,000
const TRANSFER_AMOUNT = BigInt(100_000_000);

async function main() {
  console.log("💸 Step 1: Transferring ALL tokens to Multi-sig...\n");

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
  console.log("🔐 Multi-sig:", MULTISIG.toString());
  console.log("🪙 Token Mint:", TOKEN_MINT.toString());

  // Get token accounts
  const yourTokenAccount = await getAssociatedTokenAddress(
    TOKEN_MINT,
    wallet.publicKey
  );
  const multisigTokenAccount = await getAssociatedTokenAddress(
    TOKEN_MINT,
    MULTISIG,
    true // allowOwnerOffCurve for multi-sig
  );

  console.log("\n💰 Token Accounts:");
  console.log("  Your account:", yourTokenAccount.toString());
  console.log("  Multi-sig account:", multisigTokenAccount.toString());

  // Check if multi-sig token account exists
  let multisigAccountExists = false;
  try {
    await getAccount(connection, multisigTokenAccount);
    multisigAccountExists = true;
    console.log("✅ Multi-sig token account exists");
  } catch (e) {
    console.log("⏳ Multi-sig token account needs to be created");
  }

  // Check your balance
  const yourBalance = await getAccount(connection, yourTokenAccount);
  console.log("\n📊 Your Current Balance:", Number(yourBalance.amount) / 100, "CO₂e");

  console.log("\n💸 Transferring:", Number(TRANSFER_AMOUNT) / 100, "CO₂e");
  console.log("   (ALL 1,000,000 tokens to multi-sig)");

  // Create transaction
  const tx = new Transaction();

  // Create multi-sig token account if needed
  if (!multisigAccountExists) {
    console.log("\n📝 Creating multi-sig token account...");
    const createATAIx = createAssociatedTokenAccountInstruction(
      wallet.publicKey,
      multisigTokenAccount,
      MULTISIG,
      TOKEN_MINT
    );
    tx.add(createATAIx);
  }

  // Add transfer instruction
  const transferIx = createTransferInstruction(
    yourTokenAccount,
    multisigTokenAccount,
    wallet.publicKey,
    TRANSFER_AMOUNT,
    [],
    TOKEN_PROGRAM_ID
  );
  tx.add(transferIx);

  // Send transaction
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
  const multisigBalanceAfter = await getAccount(connection, multisigTokenAccount);

  console.log("\n📊 Balances After:");
  console.log(
    "  Your balance:",
    Number(yourBalanceAfter.amount) / 100,
    "CO₂e"
  );
  console.log(
    "  Multi-sig balance:",
    Number(multisigBalanceAfter.amount) / 100,
    "CO₂e"
  );

  console.log("\n✅ Step 1 Complete!");
  console.log("   All tokens are now in the multi-sig wallet");
  console.log("\n💡 Next: Run 'yarn transfer-to-escrow' to move half to escrow");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
