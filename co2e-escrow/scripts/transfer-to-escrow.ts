import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Co2eEscrow } from "../target/types/co2e_escrow";
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
  console.log("💸 Transferring tokens from Multi-sig to Escrow...\n");

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

  // Load member wallets
  const member1Path = process.env.HOME + "/.config/solana/id.json";
  const member2Path = process.env.HOME + "/.config/solana/multisig/member2.json";
  const member3Path = process.env.HOME + "/.config/solana/multisig/member3.json";

  const member1 = anchor.web3.Keypair.fromSecretKey(
    Buffer.from(JSON.parse(fs.readFileSync(member1Path, "utf-8")))
  );
  const member2 = anchor.web3.Keypair.fromSecretKey(
    Buffer.from(JSON.parse(fs.readFileSync(member2Path, "utf-8")))
  );
  const member3 = anchor.web3.Keypair.fromSecretKey(
    Buffer.from(JSON.parse(fs.readFileSync(member3Path, "utf-8")))
  );

  console.log("👥 Multi-sig Members:");
  console.log("  Member 1:", member1.publicKey.toString());
  console.log("  Member 2:", member2.publicKey.toString());
  console.log("  Member 3:", member3.publicKey.toString());
  console.log("  Multi-sig:", MULTISIG.toString());

  // Derive escrow PDA
  const [escrowPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("escrow"), TOKEN_MINT.toBuffer()],
    program.programId
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
  const multisigBalance = await getAccount(
    provider.connection,
    multisigTokenAccount
  );
  const escrowBalance = await getAccount(provider.connection, escrowTokenAccount);

  console.log("\n📊 Balances Before:");
  console.log(
    "  Multi-sig:",
    Number(multisigBalance.amount) / 100,
    "CO₂e"
  );
  console.log("  Escrow:", Number(escrowBalance.amount) / 100, "CO₂e");

  console.log("\n💸 Transferring:", Number(TRANSFER_AMOUNT) / 100, "CO₂e");
  console.log("   (500,000 tokens = half of supply)");

  // Create transfer instruction
  const transferIx = createTransferInstruction(
    multisigTokenAccount,
    escrowTokenAccount,
    MULTISIG, // Multi-sig is the owner
    TRANSFER_AMOUNT,
    [], // No additional signers (multi-sig handles this)
    TOKEN_PROGRAM_ID
  );

  // Create transaction
  const tx = new Transaction().add(transferIx);

  // Get recent blockhash
  const { blockhash, lastValidBlockHeight } =
    await provider.connection.getLatestBlockhash();
  tx.recentBlockhash = blockhash;
  tx.feePayer = member1.publicKey;

  // Sign with 2 members (2-of-3 multi-sig)
  console.log("\n✍️  Signing with Member 1 and Member 2...");
  tx.partialSign(member1, member2);

  // Send transaction
  console.log("📤 Sending transaction...");
  const signature = await provider.connection.sendRawTransaction(tx.serialize());

  // Confirm transaction
  console.log("⏳ Confirming transaction...");
  await provider.connection.confirmTransaction({
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
    provider.connection,
    multisigTokenAccount
  );
  const escrowBalanceAfter = await getAccount(
    provider.connection,
    escrowTokenAccount
  );

  console.log("\n📊 Balances After:");
  console.log(
    "  Multi-sig:",
    Number(multisigBalanceAfter.amount) / 100,
    "CO₂e"
  );
  console.log("  Escrow:", Number(escrowBalanceAfter.amount) / 100, "CO₂e");

  console.log("\n🎉 Escrow is now funded and ready for purchases!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
