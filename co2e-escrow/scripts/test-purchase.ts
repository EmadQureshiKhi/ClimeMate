import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import {
  PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  getAccount,
} from "@solana/spl-token";
import * as fs from "fs";

// Configuration
const PROGRAM_ID = new PublicKey("FsqvhRRiENRHLncK3GKMitZT1V126pXGpT2dtVEHhMkf");
const TOKEN_MINT = new PublicKey("C9vBPNUk9ENVo5iEPY6LwBVoyNTGxZ7jU4uuqjGQde7D");
const MULTISIG = new PublicKey("9N1PSX7VLnBtmAdUj4JNVdWQjZrvi8vHftJPLuRNjLWM");

// Buy 100 CO₂e (1.00 tokens with 2 decimals)
const PURCHASE_AMOUNT = new anchor.BN(100);

async function main() {
  console.log("🛒 Testing Token Purchase (SOL goes to Multi-sig)...\n");

  // Set up provider
  const connection = new anchor.web3.Connection(
    "https://api.devnet.solana.com",
    "confirmed"
  );
  
  // Load wallet (buyer)
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

  console.log("👤 Buyer:", wallet.publicKey.toString());
  console.log("💰 Revenue Recipient (Multi-sig):", MULTISIG.toString());
  console.log("🪙 Token Mint:", TOKEN_MINT.toString());

  // Derive escrow PDA
  const [escrowPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("escrow"), TOKEN_MINT.toBuffer()],
    PROGRAM_ID
  );
  console.log("\n📦 Escrow PDA:", escrowPDA.toString());

  // Get token accounts
  const escrowTokenAccount = await getAssociatedTokenAddress(
    TOKEN_MINT,
    escrowPDA,
    true
  );
  const buyerTokenAccount = await getAssociatedTokenAddress(
    TOKEN_MINT,
    wallet.publicKey
  );

  console.log("\n💰 Token Accounts:");
  console.log("  Escrow:", escrowTokenAccount.toString());
  console.log("  Buyer:", buyerTokenAccount.toString());

  // Check if buyer token account exists
  let buyerAccountExists = false;
  try {
    await getAccount(connection, buyerTokenAccount);
    buyerAccountExists = true;
    console.log("✅ Buyer token account exists");
  } catch (e) {
    console.log("⏳ Buyer token account needs to be created");
  }

  // Get balances before
  const buyerSolBefore = await connection.getBalance(wallet.publicKey);
  const multisigSolBefore = await connection.getBalance(MULTISIG);
  const escrowTokenBalance = await getAccount(connection, escrowTokenAccount);

  console.log("\n📊 Balances Before:");
  console.log("  Buyer SOL:", buyerSolBefore / LAMPORTS_PER_SOL, "SOL");
  console.log("  Multi-sig SOL:", multisigSolBefore / LAMPORTS_PER_SOL, "SOL");
  console.log("  Escrow tokens:", Number(escrowTokenBalance.amount) / 100, "CO₂e");

  // Get escrow state
  const escrowAccount: any = await program.account.escrow.fetch(escrowPDA);
  const pricePerToken = escrowAccount.pricePerToken.toNumber();
  const totalCost = (PURCHASE_AMOUNT.toNumber() * pricePerToken) / 100;

  console.log("\n💸 Purchase Details:");
  console.log("  Amount:", PURCHASE_AMOUNT.toNumber() / 100, "CO₂e");
  console.log("  Price per token:", pricePerToken, "lamports");
  console.log("  Total cost:", totalCost / LAMPORTS_PER_SOL, "SOL");

  // Create transaction
  const tx = new anchor.web3.Transaction();

  // Create buyer token account if needed
  if (!buyerAccountExists) {
    console.log("\n📝 Creating buyer token account...");
    const createATAIx = createAssociatedTokenAccountInstruction(
      wallet.publicKey,
      buyerTokenAccount,
      wallet.publicKey,
      TOKEN_MINT
    );
    tx.add(createATAIx);
  }

  // Buy tokens - IMPORTANT: Pass MULTISIG as admin so SOL goes there!
  console.log("\n🛒 Executing purchase...");
  console.log("   ⚠️  SOL will go to MULTI-SIG, not escrow admin!");
  
  const buyIx = await program.methods
    .buyTokens(PURCHASE_AMOUNT)
    .accounts({
      escrow: escrowPDA,
      buyer: wallet.publicKey,
      admin: MULTISIG, // 🔥 THIS IS THE KEY - SOL goes to multi-sig!
      escrowTokenAccount: escrowTokenAccount,
      buyerTokenAccount: buyerTokenAccount,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .instruction();
  
  tx.add(buyIx);

  // Send transaction
  const signature = await provider.sendAndConfirm(tx);

  console.log("\n✅ Purchase complete!");
  console.log("Transaction:", signature);
  console.log(
    "View on Solscan:",
    `https://solscan.io/tx/${signature}?cluster=devnet`
  );

  // Get balances after
  const buyerSolAfter = await connection.getBalance(wallet.publicKey);
  const multisigSolAfter = await connection.getBalance(MULTISIG);
  const escrowTokenBalanceAfter = await getAccount(connection, escrowTokenAccount);
  const buyerTokenBalanceAfter = await getAccount(connection, buyerTokenAccount);

  console.log("\n📊 Balances After:");
  console.log("  Buyer SOL:", buyerSolAfter / LAMPORTS_PER_SOL, "SOL");
  console.log("  Multi-sig SOL:", multisigSolAfter / LAMPORTS_PER_SOL, "SOL");
  console.log("  Escrow tokens:", Number(escrowTokenBalanceAfter.amount) / 100, "CO₂e");
  console.log("  Buyer tokens:", Number(buyerTokenBalanceAfter.amount) / 100, "CO₂e");

  console.log("\n💰 Changes:");
  console.log("  Buyer SOL:", (buyerSolAfter - buyerSolBefore) / LAMPORTS_PER_SOL, "SOL");
  console.log("  Multi-sig SOL:", (multisigSolAfter - multisigSolBefore) / LAMPORTS_PER_SOL, "SOL ✅");
  console.log("  Buyer tokens:", "+" + Number(buyerTokenBalanceAfter.amount) / 100, "CO₂e ✅");

  // Get updated escrow stats
  const escrowAccountAfter: any = await program.account.escrow.fetch(escrowPDA);
  console.log("\n📈 Escrow Stats:");
  console.log("  Total Sold:", escrowAccountAfter.totalSold.toNumber() / 100, "CO₂e");
  console.log("  Total Revenue:", escrowAccountAfter.totalRevenue.toNumber() / LAMPORTS_PER_SOL, "SOL");

  console.log("\n🎉 Success!");
  console.log("   ✅ Buyer received tokens");
  console.log("   ✅ Multi-sig received SOL");
  console.log("   ✅ Atomic swap completed");
  console.log("\n💡 For frontend: Always pass multi-sig as 'admin' account in buy_tokens!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
