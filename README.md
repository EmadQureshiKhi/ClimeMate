# 🌱 ClimeMate

> Blockchain-powered carbon management platform with privacy-first emissions tracking, compressed NFT certificates, and carbon offset marketplace.

**Built for Solana Cypherpunk Hackathon by Colosseum**

[![Live Demo](https://img.shields.io/badge/demo-live-green)](https://climemate.vercel.app)
[![Solana](https://img.shields.io/badge/Solana-Devnet-purple)](https://solana.com)

---

## 🎯 What is ClimeMate?

ClimeMate is a comprehensive carbon management platform that combines blockchain transparency with real-world climate action. Track emissions, generate verifiable certificates, trade carbon credits, and offset your footprint—all on Solana.

### 🌱 Sustainability Features

**GHG Emissions Calculator**
- Comprehensive tool for calculating Scope 1, 2, and 3 emissions
- 200+ fuel types including fugitive gases and custom equipment
- Advanced emission factors database with regional adjustments
- Real-time data persistence and Excel export functionality

**Blockchain Certificates**
- Verifiable emissions certificates minted as compressed NFTs on Solana
- Immutable audit trails with memo transaction logging
- Public and private modes (Arcium encryption for confidential data)
- IPFS metadata storage with permanent on-chain references

**SEMA Tool**
- Complete Stakeholder Engagement and Materiality Assessment
- GRI-compliant sustainability reporting framework
- Dual materiality assessment (external + internal impacts)
- Statistical sample size calculations and risk assessment matrix

**Carbon Credit Marketplace**
- Trade verified carbon offset credits with atomic escrow swaps
- Wallet-confirmed transactions for carbon credit retirement
- Real-time CO₂e token balance tracking via Solana RPC
- Immutable transaction history on Solana blockchain

**Privacy & Transparency**
- Arcium MPC encryption for sensitive corporate emissions data
- Public verification without compromising private information
- All retirements logged on-chain with memo transactions
- Complete audit trail from issuance to retirement  

---

## 🛠️ Tech Stack

### Blockchain Infrastructure
- **Solana** - Energy-efficient, high-performance blockchain (65,000 TPS)
- **Anchor Framework** - Rust-based smart contract development for escrow program
- **Metaplex Bubblegum** - Compressed NFT standard (1000x cost reduction)
- **SPL Token Program** - Fungible token standard for CO₂e credits

### Solana Integrations
- **Arcium** - MPC-based confidential computing for private emissions data
- **Sanctum Gateway** - Multi-path transaction delivery (99.9% reliability)
- **DeCharge** - Real-world EV charging network integration with reward system

### Frontend & Authentication
- **Next.js 15** - React framework with App Router and server components
- **TypeScript** - Type-safe development across the stack
- **Tailwind CSS** - Utility-first styling with custom design system
- **Privy** - Multi-wallet authentication (Phantom, Solflare, WalletConnect)

### Backend & Database
- **PostgreSQL** - Relational database with Row Level Security (Supabase)
- **Prisma** - Type-safe ORM with migration management
- **Next.js API Routes** - Serverless functions for blockchain interactions
- **IPFS** - Decentralized metadata storage for NFT certificates

---

## 🎮 Features Walkthrough

### 1. GHG Calculator
- **Comprehensive Emissions Tracking:** Calculate Scope 1, 2, and 3 emissions with industry-standard methodologies
- **200+ Fuel Types:** Including fugitive gases, custom equipment, and regional emission factors
- **Real-time Calculations:** Instant emissions totals with category breakdowns
- **Data Persistence:** All calculations saved per user with full edit history
- **Excel Export:** Multi-sheet reports with detailed emission factors and sources
- **GRI Compliance:** Aligned with Global Reporting Initiative standards

### 2. Generate Certificate
- **Upload CSV Data:** Bulk import emissions data or use interactive calculator
- **Public/Private Modes:** Choose Arcium encryption for confidential corporate data
- **Compressed NFT Minting:** Receive blockchain certificate at 1000x lower cost than standard NFTs
- **IPFS Metadata:** Permanent decentralized storage with on-chain CID reference
- **Wallet Integration:** View certificates in Phantom, Solflare, or any Solana wallet
- **Solscan Verification:** Public blockchain proof with transaction explorer links

### 3. Offset Emissions
- **Carbon Credit Marketplace:** Browse verified offset projects and purchase CO₂e tokens
- **Atomic Escrow Swaps:** Secure token purchases with instant settlement (no intermediaries)
- **Wallet-Confirmed Retirement:** Users approve retirement transactions in their wallet
- **Permanent Token Burn:** Retired tokens removed from supply (verifiable on-chain)
- **Memo Transaction Logging:** Every retirement recorded with certificate ID, amount, and timestamp
- **Updated NFT Minting:** New certificate showing offset percentage and retirement history
- **Real-time Balance Tracking:** Live CO₂e token balance via Solana RPC

### 4. SEMA Tool
- **Stakeholder Engagement:** Systematic identification and prioritization of stakeholders
- **Materiality Assessment:** Dual materiality analysis (impact + financial materiality)
- **Statistical Sampling:** Calculate required sample sizes for stakeholder surveys
- **Risk Assessment Matrix:** Visual mapping of material topics by significance
- **GRI Framework Mapping:** Automatic disclosure recommendations based on material topics
- **Automated Reporting:** Export comprehensive sustainability reports (Excel/PDF)

### 5. Earn Rewards (DeCharge Integration)
- **Real-world EV Charging:** Earn CO₂e credits at DeCharge network stations
- **Automatic Credit Issuance:** Credits awarded based on kWh charged
- **Live Activity Feed:** Real-time updates of charging sessions and rewards
- **Leaderboard:** Compete with other users for top sustainability rankings
- **Reward Redemption:** Use earned credits for offsets or marketplace purchases

### 6. Verify Certificates
- **Public Verification:** No login required - anyone can verify certificates
- **Transaction ID Lookup:** Enter Solana transaction signature to view certificate
- **Emissions Data Display:** View total emissions, category breakdowns, and offset status
- **Retirement History:** Parse memo transaction logs for complete audit trail
- **Blockchain Proof:** Direct links to Solana Explorer and Solscan for verification
- **Immutable Records:** All data cryptographically secured on Solana blockchain

---

## 🏗️ Project Structure

```
ClimeMate/
├── src/
│   ├── app/              # Next.js pages and API routes
│   ├── components/       # React components
│   ├── lib/              # Core libraries (Solana, Arcium, etc.)
│   ├── hooks/            # Custom React hooks
│   └── data/             # Static data and catalogs
├── co2e-escrow/          # Anchor escrow program
├── prisma/               # Database schema
├── migrations/           # SQL migrations
├── public/               # Static assets
└── docs/                 # Documentation
```

---

## 🔐 Blockchain Architecture and On-chain Proof

### CO₂e Token & Escrow System

**CO₂e Token (ClimeMate Offset Token)**
- **Token Mint:** [C9vBPNUk9ENVo5iEPY6LwBVoyNTGxZ7jU4uuqjGQde7D](https://solscan.io/token/C9vBPNUk9ENVo5iEPY6LwBVoyNTGxZ7jU4uuqjGQde7D?cluster=devnet)
- **Supply:** 1,000,000 CO₂e (2 decimals)
- **Mint Authority:** 2-of-3 Multi-sig wallet
- **Status:** Active on Solana Devnet

**Escrow Program**
- **Program ID:** [FsqvhRRiENRHLncK3GKMitZT1V126pXGpT2dtVEHhMkf](https://solscan.io/account/FsqvhRRiENRHLncK3GKMitZT1V126pXGpT2dtVEHhMkf?cluster=devnet)
- **Type:** Atomic swap escrow (Anchor framework)
- **Price:** 0.00005 SOL per CO₂e token
- **Holdings:** 499,999 CO₂e available for purchase
- **Revenue:** Flows to multi-sig treasury

**Multi-sig Treasury (2-of-3)**
- **Address:** [9N1PSX7VLnBtmAdUj4JNVdWQjZrvi8vHftJPLuRNjLWM](https://solscan.io/account/9N1PSX7VLnBtmAdUj4JNVdWQjZrvi8vHftJPLuRNjLWM?cluster=devnet)
- **Type:** Native Solana multi-signature
- **Threshold:** 2 out of 3 signatures required
- **Reserves:** 500,000 CO₂e tokens
- **Purpose:** Secure treasury management and mint authority

### Retirement & Audit Logging

**Token Retirement Process:**
1. User purchases CO₂e tokens from escrow
2. Tokens transferred to user's wallet
3. User initiates retirement against certificate
4. Tokens burned permanently (supply decreases)
5. Memo transaction logs retirement details on-chain
6. Updated NFT minted showing new offset percentage

**Blockchain Audit Trail:**
- Every retirement creates a Solana memo transaction
- Memo contains: certificate ID, amount retired, timestamp, user wallet
- Logs are immutable and publicly verifiable
- Verify page parses memo logs from transaction history
- Full transparency for carbon credit accounting

**Remint Process:**
- After retirement, certificate NFT is updated
- New compressed NFT minted with current offset data
- Previous NFT remains as historical record
- Memo transaction logs the remint operation
- Creates complete audit chain from issuance to retirement

---

## 🔒 Security & Authentication

### Multi-Wallet Support
- **Phantom:** Native Solana wallet with mobile and browser support
- **Solflare:** Hardware wallet compatible with Ledger integration
- **WalletConnect:** QR code-based connection for mobile wallets
- **Email/Google:** Traditional authentication with optional wallet linking via Privy

### Row Level Security (RLS)
- **Wallet-based Access:** Users can only access their own emissions data and certificates
- **Auth Session Support:** Compatible with both wallet and email authentication
- **Secure Registration:** Protected user creation with validation and rate limiting
- **Database Isolation:** PostgreSQL RLS policies enforce data separation

### Transaction Security
- **Client-side Signing:** All transactions require wallet confirmation (user controls private keys)
- **Atomic Operations:** Escrow swaps execute instantly or fail completely (no partial states)
- **Memo Logging:** Immutable on-chain records for every retirement and remint operation
- **Multi-sig Treasury:** 2-of-3 signature requirement for token supply management

---

## 🌍 Environmental Impact

### Carbon Footprint Reduction
- **Accurate Tracking:** Precise emissions calculation with 200+ fuel types and regional factors
- **Verified Offsets:** Blockchain-verified carbon credit retirement with permanent token burns
- **Transparency:** Public audit trail on energy-efficient Solana blockchain
- **Efficiency:** Automated processes reduce administrative overhead and paper waste

### Sustainability Reporting
- **GRI Compliance:** Aligned with Global Reporting Initiative standards for ESG reporting
- **Stakeholder Engagement:** Systematic materiality assessment with statistical rigor
- **Data Integrity:** Immutable record keeping prevents greenwashing and double-counting
- **Continuous Monitoring:** Real-time emissions and offset tracking with blockchain proof

### Blockchain Sustainability
- **Energy Efficient:** Solana uses Proof-of-Stake (0.00051 kWh per transaction vs Bitcoin's 700 kWh)
- **Low Cost:** Transaction fees under $0.001 enable micro-transactions and accessibility
- **High Throughput:** 65,000 TPS capacity supports global-scale carbon credit trading
- **Compressed NFTs:** 1000x cost reduction makes certificate issuance economically viable

---

## 🌟 Solana Cypherpunk Hackathon

This project was built for the **Solana Cypherpunk Hackathon** by Colosseum, showcasing:

✅ **Privacy** - Arcium MPC for confidential emissions data  
✅ **Optimization** - Sanctum Gateway for reliable transaction delivery  
✅ **Real-world Utility** - DeCharge integration for actual EV charging  
✅ **Cost Efficiency** - Compressed NFTs at 1000x lower cost  
✅ **Compliance** - GRI-aligned reporting and audit trails  

---

## 🔗 Links & Resources

### Live Platform
- **Demo:** https://climemate.vercel.app
- **Documentation:** [SOLANA_INTEGRATIONS.md](./docs/SOLANA_INTEGRATIONS.md)

### Blockchain Explorers
- **Solana Explorer:** https://explorer.solana.com
- **Solscan:** https://solscan.io

### Integrated Protocols
- **Arcium:** https://arcium.com
- **Sanctum Gateway:** https://gateway.sanctum.so
- **DeCharge:** https://decharge.io
- **Metaplex:** https://www.metaplex.com

### On-chain Proof
- **CO₂e Token:** [C9vBPNUk9ENVo5iEPY6LwBVoyNTGxZ7jU4uuqjGQde7D](https://solscan.io/token/C9vBPNUk9ENVo5iEPY6LwBVoyNTGxZ7jU4uuqjGQde7D?cluster=devnet)
- **Escrow Program:** [FsqvhRRiENRHLncK3GKMitZT1V126pXGpT2dtVEHhMkf](https://solscan.io/account/FsqvhRRiENRHLncK3GKMitZT1V126pXGpT2dtVEHhMkf?cluster=devnet)
- **Multi-sig Treasury:** [9N1PSX7VLnBtmAdUj4JNVdWQjZrvi8vHftJPLuRNjLWM](https://solscan.io/account/9N1PSX7VLnBtmAdUj4JNVdWQjZrvi8vHftJPLuRNjLWM?cluster=devnet)

---

Built with ❤️ for a sustainable future

---

**Made with Solana 🌞**
