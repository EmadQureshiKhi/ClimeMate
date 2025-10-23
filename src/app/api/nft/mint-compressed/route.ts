import { NextRequest, NextResponse } from 'next/server';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { createTree, mintV1, mplBubblegum } from '@metaplex-foundation/mpl-bubblegum';
import { 
  generateSigner, 
  createSignerFromKeypair,
  signerIdentity,
} from '@metaplex-foundation/umi';
import bs58 from 'bs58';

const SOLANA_RPC = process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.devnet.solana.com';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { certificateData, userWallet, userId } = body;

    console.log('🎨 Starting compressed NFT mint with UMI...');
    console.log('👤 User wallet:', userWallet);
    console.log('📜 Certificate ID:', certificateData.certificateId);

    // Validate inputs
    if (!certificateData || !userWallet || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Load backend wallet
    const backendWalletKey = process.env.BACKEND_WALLET_PRIVATE_KEY;
    if (!backendWalletKey) {
      console.error('❌ BACKEND_WALLET_PRIVATE_KEY not configured');
      return NextResponse.json(
        { error: 'Backend wallet not configured' },
        { status: 500 }
      );
    }

    // Decode private key (support both base58 and base64)
    let secretKey: Uint8Array;
    try {
      secretKey = bs58.decode(backendWalletKey);
    } catch (e) {
      secretKey = Buffer.from(backendWalletKey, 'base64');
    }

    // Create UMI instance
    const umi = createUmi(SOLANA_RPC);
    
    // Import the backend wallet into UMI
    const backendKeypair = umi.eddsa.createKeypairFromSecretKey(secretKey);
    const backendSigner = createSignerFromKeypair(umi, backendKeypair);
    
    // Set the backend wallet as the identity
    umi.use(signerIdentity(backendSigner));
    umi.use(mplBubblegum());

    console.log('🔑 Backend wallet:', backendSigner.publicKey);

    // Check balance
    const balance = await umi.rpc.getBalance(backendSigner.publicKey);
    console.log('💰 Backend wallet balance:', Number(balance.basisPoints) / 1e9, 'SOL');

    if (Number(balance.basisPoints) < 0.01 * 1e9) {
      return NextResponse.json(
        { 
          error: 'Backend wallet has insufficient funds. Please fund it with at least 0.01 SOL.',
          backendWallet: backendSigner.publicKey.toString(),
        },
        { status: 500 }
      );
    }

    // Use our own API endpoint for metadata (short URI for compressed NFTs)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const metadataUri = `${baseUrl}/api/nft/metadata/${certificateData.certificateId}`;
    
    console.log('📝 Metadata URI:', metadataUri);
    console.log('📏 URI length:', metadataUri.length, 'chars (max 200)');

    // Check if we have an existing tree, otherwise create one
    let merkleTreeAddress = process.env.MERKLE_TREE_ADDRESS;
    
    if (!merkleTreeAddress) {
      console.log('🌳 No existing tree found, creating new merkle tree...');
      const merkleTree = generateSigner(umi);
      
      const createTreeTx = await createTree(umi, {
        merkleTree,
        maxDepth: 14, // Can hold up to 16,384 NFTs
        maxBufferSize: 64,
      });

      await createTreeTx.sendAndConfirm(umi);
      merkleTreeAddress = merkleTree.publicKey.toString();
      
      console.log('✅ Merkle tree created:', merkleTreeAddress);
      console.log('💡 Add this to your .env file to reuse it:');
      console.log(`MERKLE_TREE_ADDRESS=${merkleTreeAddress}`);
      console.log('');
    } else {
      console.log('🌳 Using existing merkle tree:', merkleTreeAddress);
    }

    // Mint compressed NFT to user
    console.log('🎨 Minting compressed NFT to user...');
    
    // NFT name must be max 32 characters
    const nftName = certificateData.certificateId.startsWith('GHG-CALC-') 
      ? `GHG Cert ${certificateData.certificateId.substring(9, 22)}`  // "GHG Cert 1761162690888" = 23 chars
      : `Carbon ${certificateData.certificateId.substring(4, 20)}`;    // "Carbon 1761162690888" = 20 chars
    
    console.log('🏷️ NFT Name:', nftName, `(${nftName.length} chars)`);
    
    const mintTx = mintV1(umi, {
      leafOwner: userWallet as any,
      merkleTree: merkleTreeAddress as any,
      metadata: {
        name: nftName,
        uri: metadataUri,
        sellerFeeBasisPoints: 0,
        collection: null,
        creators: [
          {
            address: backendSigner.publicKey,
            verified: true,
            share: 100,
          },
        ],
      },
    });

    const result = await mintTx.sendAndConfirm(umi);
    const signature = bs58.encode(result.signature);

    console.log('✅ Compressed NFT minted successfully!');
    console.log('📝 Transaction:', signature);
    console.log('🌳 Merkle Tree:', merkleTreeAddress);

    return NextResponse.json({
      success: true,
      nftAddress: merkleTreeAddress,
      transactionSignature: signature,
      metadataUri,
      merkleTree: merkleTreeAddress,
      message: 'Compressed NFT minted! It will appear in your wallet within 30 seconds.',
    }, { status: 200 });

  } catch (error: any) {
    console.error('❌ Error minting compressed NFT:', error);
    return NextResponse.json(
      { 
        error: 'Failed to mint compressed NFT', 
        details: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}
