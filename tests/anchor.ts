import * as web3 from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { TransferHook } from '../target/types/transfer_hook';
import { PublicKey, SystemProgram, Transaction, sendAndConfirmTransaction, Keypair } from '@solana/web3.js';
import {
  ExtensionType,
  TOKEN_2022_PROGRAM_ID,
  getMintLen,
  createInitializeMintInstruction,
  createInitializeTransferHookInstruction,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  getAssociatedTokenAddressSync,
  createTransferCheckedWithTransferHookInstruction,
} from '@solana/spl-token';

import programSign from '../target/deploy/transfer_hook-keypair.json'
import { AmountPool } from './types';
const programKey = Keypair.fromSecretKey(Uint8Array.from(programSign));

describe('transfer-hook', () => {
  const EXTRA_ACCOUNT_METAS_SEED = "extra-account-metas";
  const AMOUNT_POOL_SEED = "amount";
  const ADMIN_ADDRESS = "5RoELXPzGfPFJ8DqHXX6QmgLguYERWfptPC3SUkwCBGz";
  
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.TransferHook as anchor.Program<TransferHook>;

  const wallet = provider.wallet as anchor.Wallet;
  const connection = provider.connection;

  // Generate keypair to use as address for the transfer-hook enabled mint
  const mint = new Keypair();
  const decimals = 9;

  // Sender token account address
  const sourceTokenAccount = getAssociatedTokenAddressSync(
    mint.publicKey,
    wallet.publicKey,
    false,
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );

  // Recipient token account address
  const recipient = Keypair.generate();
  const destinationTokenAccount = getAssociatedTokenAddressSync(
    mint.publicKey,
    recipient.publicKey,
    false,
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );

  it('Create Mint Account with Transfer Hook Extension and Transfer Fee Extension', async () => {
    const extensions = [ExtensionType.TransferHook];
    const mintLen = getMintLen(extensions);
    const lamports = await provider.connection.getMinimumBalanceForRentExemption(mintLen);

    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from(AMOUNT_POOL_SEED), mint.publicKey.toBuffer()],
      program.programId, // transfer hook program ID
    );

    console.log('====================================');
    console.log(pda);

    const transaction = new Transaction().add(
      SystemProgram.createAccount({
        fromPubkey: wallet.publicKey,
        newAccountPubkey: mint.publicKey,
        space: mintLen,
        lamports: lamports,
        programId: TOKEN_2022_PROGRAM_ID,
      }),
      createInitializeTransferHookInstruction(
        mint.publicKey,
        wallet.publicKey,
        program.programId, // Transfer Hook Program ID
        TOKEN_2022_PROGRAM_ID,
      ),
      createInitializeMintInstruction(mint.publicKey, decimals, wallet.publicKey, null, TOKEN_2022_PROGRAM_ID),
    );

    const txSig = await sendAndConfirmTransaction(provider.connection, transaction, [wallet.payer, mint]);
    console.log(`Transaction Signature: ${txSig}`);
  });

  // Create the two token accounts for the transfer-hook enabled mint
  // Fund the sender token account with 100 tokens
  it('Create Token Accounts and Mint Tokens', async () => {
    // 100 tokens
    const amount = 100 * 10 ** decimals;

    const transaction = new Transaction().add(
      createAssociatedTokenAccountInstruction(
        wallet.publicKey,
        sourceTokenAccount,
        wallet.publicKey,
        mint.publicKey,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID,
      ),
      createAssociatedTokenAccountInstruction(
        wallet.publicKey,
        destinationTokenAccount,
        recipient.publicKey,
        mint.publicKey,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID,
      ),
      createMintToInstruction(mint.publicKey, sourceTokenAccount, wallet.publicKey, amount, [], TOKEN_2022_PROGRAM_ID),
    );

    const txSig = await sendAndConfirmTransaction(connection, transaction, [wallet.payer], {
      skipPreflight: true,
      commitment: 'confirmed',
    });

    console.log(`Transaction Signature: ${txSig}`);
  });

  // Account to store extra accounts required by the transfer hook instruction
  it('Create ExtraAccountMetaList Account', async () => {
    await initializeExtraAccountMetaList(mint.publicKey);
  });

  it('Add Whitelist', async () => {
    await addWhitelist(mint.publicKey, new PublicKey("5RoELXPzGfPFJ8DqHXX6QmgLguYERWfptPC3SUkwCBGz"));
    await addWhitelist(mint.publicKey, new PublicKey("Bw6cx4qzWygKDLtbThv8TxESxsUsEXmcv1X4gUPbSycc"));
  })

  // it('Add Whitelist again',async () => {
  //   await addWhitelist(mint.publicKey, new PublicKey("Bw6cx4qzWygKDLtbThv8TxESxsUsEXmcv1X4gUPbSycc"));
  // })

  it('Remove Whitelist',async () => {
    await removeWhitelist(mint.publicKey, new PublicKey("Bw6cx4qzWygKDLtbThv8TxESxsUsEXmcv1X4gUPbSycc"));
  })
  
  it('Transfer Hook with Extra Account Meta', async () => {
    // 1 tokens
    const amount = 1 * 10 ** decimals;
    const bigIntAmount = BigInt(amount);

    // Standard token transfer instruction
    const transferInstruction = await createTransferCheckedWithTransferHookInstruction(
      connection,
      sourceTokenAccount,
      mint.publicKey,
      destinationTokenAccount,
      wallet.publicKey,
      bigIntAmount,
      decimals,
      [],
      'confirmed',
      TOKEN_2022_PROGRAM_ID,
    );

    const transaction = new Transaction().add(transferInstruction);

    const txSig = await sendAndConfirmTransaction(connection, transaction, [wallet.payer], {
      skipPreflight: true,
      commitment: 'confirmed',
    });
    console.log('Transfer Signature:', txSig);

    console.log(await getAmountPool(mint.publicKey));
  });

  const addWhitelist = async (mint: PublicKey, address: PublicKey) => {
    const [amountPool] = PublicKey.findProgramAddressSync(
      [Buffer.from(AMOUNT_POOL_SEED), mint.toBuffer()],
      program.programId,
    );

    const addWhitelistInstruction = await program.methods
      .addWhitelist(address)
      .accounts({
        admin: new PublicKey(ADMIN_ADDRESS),
        amountPool: amountPool,
        mint,
      })
      .instruction();

    const transaction = new Transaction().add(addWhitelistInstruction);

    const txSig = await sendAndConfirmTransaction(provider.connection, transaction, [wallet.payer], {
      skipPreflight: true,
      commitment: 'confirmed',
    });
    console.log('Transaction Signature:', txSig);
  }

  const removeWhitelist = async (mint: PublicKey, address: PublicKey) => {
    const [amountPool] = PublicKey.findProgramAddressSync(
      [Buffer.from(AMOUNT_POOL_SEED), mint.toBuffer()],
      program.programId,
    );

    const removeWhitelistInstruction = await program.methods
      .removeWhitelist(address)
      .accounts({
        admin: new PublicKey(ADMIN_ADDRESS),
        amountPool: amountPool,
        mint,
      })
      .instruction();

    const transaction = new Transaction().add(removeWhitelistInstruction);

    const txSig = await sendAndConfirmTransaction(provider.connection, transaction, [wallet.payer], {
      skipPreflight: true,
      commitment: 'confirmed',
    });
    console.log('Transaction Signature:', txSig);
  }
  
  const updateAmount = async (mint: PublicKey, address: PublicKey, amount: anchor.BN) => {
    const [amountPool] = PublicKey.findProgramAddressSync(
      [Buffer.from(AMOUNT_POOL_SEED), mint.toBuffer()],
      program.programId,
    );

    const updateAmountInstruction = await program.methods
      .updateAmount(address, amount)
      .accounts({
        admin: new PublicKey(ADMIN_ADDRESS),
        amountPool: amountPool,
        mint,
      })
      .instruction();

    const transaction = new Transaction().add(updateAmountInstruction);

    const txSig = await sendAndConfirmTransaction(provider.connection, transaction, [wallet.payer], {
      skipPreflight: true,
      commitment: 'confirmed',
    });
    console.log('Transaction Signature:', txSig);
  }

  const initializeExtraAccountMetaList = async (mint: PublicKey) => {
    // ExtraAccountMetaList address
    // Store extra accounts required by the custom transfer hook instruction
    const [extraAccountMetaListPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from(EXTRA_ACCOUNT_METAS_SEED), mint.toBuffer()],
      program.programId,
    );
    const [amountPool] = PublicKey.findProgramAddressSync(
      [Buffer.from(AMOUNT_POOL_SEED), mint.toBuffer()],
      program.programId,
    );

    const initializeExtraAccountMetaListInstruction = await program.methods
      .initializeExtraAccountMetaList()
      .accounts({
        mint,
        extraAccountMetaList: extraAccountMetaListPDA,
        amountPool,
      })
      .instruction();

    const transaction = new Transaction().add(initializeExtraAccountMetaListInstruction);

    const txSig = await sendAndConfirmTransaction(provider.connection, transaction, [wallet.payer], {
      skipPreflight: true,
      commitment: 'confirmed',
    });
    console.log('Transaction Signature:', txSig);
  }

  const getAmountPool = async (mint: PublicKey) : Promise<AmountPool | null>  => {
    const [amountPool] = PublicKey.findProgramAddressSync(
      [Buffer.from(AMOUNT_POOL_SEED), mint.toBuffer()],
      program.programId,
    );

    try {
      return await program.account.amountPool.fetch(amountPool) as undefined as AmountPool
    } catch {
      return null
    }
  }
});
