import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Co2eEscrow } from "../target/types/co2e_escrow";
import {
  PublicKey,
  Keypair,
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

// Price: 0.00005 SOL per token (with 2 decimals)
// 0.00005 SOL = 50,000 lamports
// But contract divides by 100 for decimals, so we set 50,000
const PRICE_PER_TOKEN = new anchor.BN(50000);

async function main() {
  console.log("🚀 Initializing CO2e Escrow...\n");

  // Set up provider
  const connection = new anchor.web3.Connection(
    "https://api.devnet.solana.com",
    "confirmed"
  );
  
  // Load wallet
  const walletPath = process.env.HOME + "/.config/solana/id.json";
  const walletKeypair = Keypair.fromSecretKey(
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
  console.log("Program ID:", program.programId.toString());

  // Admin wallet (you)
  const admin = provider.wallet.publicKey;
  console.log("Admin:", admin.toString());
  console.log("Multi-sig:", MULTISIG.toString());
  console.log("Token Mint:", TOKEN_MINT.toString());

  // Derive escrow PDA
  const [escrowPDA, escrowBump] = PublicKey.findProgramAddressSync(
    [Buffer.from("escrow"), TOKEN_MINT.toBuffer()],
    program.programId
  );
  console.log("\n📦 Escrow PDA:", escrowPDA.toString());

  // Get escrow's associated token account
  const escrowTokenAccount = await getAssociatedTokenAddress(
    TOKEN_MINT,
    escrowPDA,
    true // allowOwnerOffCurve
  );
  console.log("Escrow Token Account:", escrowTokenAccount.toString());

  // Check if escrow token account exists
  let escrowTokenAccountExists = false;
  try {
    await getAccount(provider.connection, escrowTokenAccount);
    escrowTokenAccountExists = true;
    console.log("✅ Escrow token account already exists");
  } catch (e) {
    console.log("⏳ Escrow token account needs to be created");
  }

  // Create escrow token account if needed
  if (!escrowTokenAccountExists) {
    console.log("\n📝 Creating escrow token account...");
    const createATAIx = createAssociatedTokenAccountInstruction(
      admin,
      escrowTokenAccount,
      escrowPDA,
      TOKEN_MINT
    );

    const tx = new anchor.web3.Transaction().add(createATAIx);
    const sig = await provider.sendAndConfirm(tx);
    console.log("✅ Created escrow token account:", sig);
  }

  // Check if escrow is already initialized
  try {
    const escrowAccount: any = await program.account.escrow.fetch(escrowPDA);
    console.log("\n⚠️  Escrow already initialized!");
    console.log("Current price:", escrowAccount.pricePerToken.toString());
    console.log("Total sold:", escrowAccount.totalSold.toString());
    console.log("Total revenue:", escrowAccount.totalRevenue.toString());
    return;
  } catch (e) {
    console.log("\n✅ Escrow not initialized yet, proceeding...");
  }

  // Initialize escrow
  console.log("\n🎯 Initializing escrow with price:", PRICE_PER_TOKEN.toString(), "lamports");
  console.log("   (0.00005 SOL per token with 2 decimals)");

  try {
    const tx = await program.methods
      .initialize(PRICE_PER_TOKEN)
      .accounts({
        escrow: escrowPDA,
        admin: admin,
        tokenMint: TOKEN_MINT,
        escrowTokenAccount: escrowTokenAccount,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("\n✅ Escrow initialized!");
    console.log("Transaction:", tx);
    console.log(
      "View on Solscan:",
      `https://solscan.io/tx/${tx}?cluster=devnet`
    );

    // Fetch and display escrow state
    const escrowAccount: any = await program.account.escrow.fetch(escrowPDA);
    console.log("\n📊 Escrow State:");
    console.log("  Admin:", escrowAccount.admin.toString());
    console.log("  Token Mint:", escrowAccount.tokenMint.toString());
    console.log("  Token Account:", escrowAccount.escrowTokenAccount.toString());
    console.log("  Price per Token:", escrowAccount.pricePerToken.toString());
    console.log("  Total Sold:", escrowAccount.totalSold.toString());
    console.log("  Total Revenue:", escrowAccount.totalRevenue.toString());

    // Check token balance
    const tokenAccountInfo = await getAccount(
      provider.connection,
      escrowTokenAccount
    );
    console.log("\n💰 Escrow Token Balance:", tokenAccountInfo.amount.toString());
    console.log("   (", Number(tokenAccountInfo.amount) / 100, "CO₂e tokens)");

    if (tokenAccountInfo.amount === BigInt(0)) {
      console.log("\n⚠️  WARNING: Escrow has 0 tokens!");
      console.log("   You need to transfer tokens from multi-sig to escrow");
      console.log("   Escrow token account:", escrowTokenAccount.toString());
    }

    console.log("\n🎉 Escrow is ready for purchases!");
  } catch (error) {
    console.error("\n❌ Error initializing escrow:", error);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
