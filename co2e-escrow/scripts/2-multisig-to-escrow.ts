import * as anchor from "@coral-xyz/anchor";
import {
  PublicKey,
  Transaction,
  TransactionInstruction,
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
const MULTISIG = new PublicKey("9N1PSX7VLnBtmAdUj4JNVdWQjZrvi8vHftJPLuRNjLWM");
const PROGRAM_ID = new PublicKey("FsqvhRRiENRHLncK3GKMitZT1V126pXGpT2dtVEHhMkf");

// Amount to transfer: 500,000 CO₂e (half of 1,000,000)
// With 2 decimals: 500,000 * 100 = 50,000,000
const TRANSFER_AMOUNT = BigInt(50_000_000);

async function main() {
  console.log("💸 Step 2: Transferring HALF of tokens from Multi-sig to Escrow...\n");

  // Set up connection
  const connection = new anchor.web3.Connection(
    "https://api.devnet.solana.com",
    "confirmed"
  );

  // Load member wallets
  const member1Path = process.env.HOME + "/.config/solana/id.json";
  const member2Path = process.env.HOME + "/.config/solana/multisig/member2.json";

  const member1 = anchor.web3.Keypair.fromSecretKey(
    Buffer.from(JSON.parse(fs.readFileSync(member1Path, "utf-8")))
  );
  const member2 = anchor.web3.Keypair.fromSecretKey(
    Buffer.from(JSON.parse(fs.readFileSync(member2Path, "utf-8")))
  );

  console.log("👥 Multi-sig Members (signing with 2 of 3):");
  console.log("  Member 1:", member1.publicKey.toString());
  console.log("  Member 2:", member2.publicKey.toString());
  console.log("  Multi-sig:", MULTISIG.toString());

  // Derive escrow PDA
  const [escrowPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("escrow"), TOKEN_MINT.toBuffer()],
    PROGRAM_ID
  );
  console.log("\n📦 Escrow PDA:", escrowPDA.toString());

  // Get token accounts
  const multisigTokenAccount = await getAssociatedTokenAddress(
    TOKEN_MINT,
    MULTISIG,
    true
  );
  const escrowTokenAccount = await getAssociatedTokenAddress(
    TOKEN_MINT,
    escrowPDA,
    true
  );

  console.log("\n💰 Token Accounts:");
  console.log("  Multi-sig:", multisigTokenAccount.toString());
  console.log("  Escrow:", escrowTokenAccount.toString());

  // Check balances before
  const multisigBalance = await getAccount(connection, multisigTokenAccount);
  const escrowBalance = await getAccount(connection, escrowTokenAccount);

  console.log("\n📊 Balances Before:");
  console.log(
    "  Multi-sig:",
    Number(multisigBalance.amount) / 100,
    "CO₂e"
  );
  console.log("  Escrow:", Number(escrowBalance.amount) / 100, "CO₂e");

  console.log("\n💸 Transferring:", Number(TRANSFER_AMOUNT) / 100, "CO₂e");
  console.log("   (500,000 tokens = half of supply)");
  console.log("   Multi-sig will keep the other half");

  // Create transfer instruction
  // For multi-sig, we need to use the multi-sig as the authority
  const transferIx = createTransferInstruction(
    multisigTokenAccount,
    escrowTokenAccount,
    MULTISIG, // Multi-sig is the owner
    TRANSFER_AMOUNT,
    [member1, member2], // Signers (2 of 3)
    TOKEN_PROGRAM_ID
  );

  // Create transaction
  const tx = new Transaction().add(transferIx);

  // Get recent blockhash
  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash();
  tx.recentBlockhash = blockhash;
  tx.feePayer = member1.publicKey;

  // Sign with 2 members (2-of-3 multi-sig)
  console.log("\n✍️  Signing with Member 1 and Member 2...");
  tx.sign(member1, member2);

  // Send transaction
  console.log("📤 Sending transaction...");
  const signature = await connection.sendRawTransaction(tx.serialize());

  // Confirm transaction
  console.log("⏳ Confirming transaction...");
  await connection.confirmTransaction({
    signature,
    blockhash,
    lastValidBlockHeight,
  });

  console.log("\n✅ Transfer complete!");
  console.log("Transaction:", signature);
  console.log(
    "View on Solscan:",
    `https://solscan.io/tx/${signature}?cluster=devnet`
  );

  // Check balances after
  const multisigBalanceAfter = await getAccount(
    connection,
    multisigTokenAccount
  );
  const escrowBalanceAfter = await getAccount(
    connection,
    escrowTokenAccount
  );

  console.log("\n📊 Balances After:");
  console.log(
    "  Multi-sig:",
    Number(multisigBalanceAfter.amount) / 100,
    "CO₂e (kept for reserves)"
  );
  console.log(
    "  Escrow:",
    Number(escrowBalanceAfter.amount) / 100,
    "CO₂e (available for sale)"
  );

  console.log("\n🎉 Setup Complete!");
  console.log("   ✅ Multi-sig has 500,000 CO₂e (reserves)");
  console.log("   ✅ Escrow has 500,000 CO₂e (for sale)");
  console.log("   ✅ Users can now buy tokens!");
  console.log("\n💰 Revenue from sales will go to:", member1.publicKey.toString());
  console.log("   (You can update this to multi-sig later if needed)");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
