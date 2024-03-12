import { Keypair, SystemProgram, Transaction, sendAndConfirmTransaction } from '@solana/web3.js';
import tokenAddressSecretKey from '../authorities/token_address.json'
import transferFeeConfigAuthoritySecretKey from '../authorities/transferfee_config_authority.json'
import withdrawWithheldAuthoritySecretKey from '../authorities/withdraw_withheld_authority.json'
import { ExtensionType, TOKEN_2022_PROGRAM_ID, createAssociatedTokenAccountIdempotent, createInitializeMintInstruction, createInitializeTransferFeeConfigInstruction, createInitializeTransferHookInstruction, getMintLen, mintTo } from '@solana/spl-token';
import { decimals, feeBasisPoints, maxFee } from './vars';
import { addWhitelist, connection, getAmountPool, initializeExtraAccountMetaList, transfer, wallet } from './client';
import { PublicKey } from '@metaplex-foundation/js';
import { generateExplorerTxUrl } from './utils';
const bs58 = require('bs58');

const mintKeypair = Keypair.fromSecretKey(Uint8Array.from(tokenAddressSecretKey));
const transferFeeConfigAuthority = Keypair.fromSecretKey(Uint8Array.from(transferFeeConfigAuthoritySecretKey));
const withdrawWithheldAuthority = Keypair.fromSecretKey(Uint8Array.from(withdrawWithheldAuthoritySecretKey));
const mint = mintKeypair.publicKey;

console.log(mintKeypair.publicKey.toString());
console.log(transferFeeConfigAuthority.publicKey.toString());
console.log(withdrawWithheldAuthority.publicKey.toString());

// Define the extensions to be used by the mint
const extensions = [
    ExtensionType.TransferFeeConfig,
    ExtensionType.TransferHook,
];

// Calculate the length of the mint
const mintLen = getMintLen(extensions);
const payer = wallet.payer;
const mintAuthority = payer;

const createToken = async() => {
    const mintLamports = await connection.getMinimumBalanceForRentExemption(mintLen);
    const mintTransaction = new Transaction().add(
        SystemProgram.createAccount({
            fromPubkey: wallet.publicKey,
            newAccountPubkey: mint,
            space: mintLen,
            lamports: mintLamports,
            programId: TOKEN_2022_PROGRAM_ID,
        }),
        createInitializeTransferFeeConfigInstruction(
            mint,
            transferFeeConfigAuthority.publicKey,
            withdrawWithheldAuthority.publicKey,
            feeBasisPoints,
            maxFee,
            TOKEN_2022_PROGRAM_ID
        ),
        createInitializeTransferHookInstruction(
            mint,
            mintAuthority.publicKey,
            new PublicKey("7XZAbVvb2Ubu8SUEPKkE7nBYT8qedoPjhmFSnQ3VFYzr"), // Transfer Hook Program ID
            TOKEN_2022_PROGRAM_ID,
        ),
        createInitializeMintInstruction(mint, decimals, mintAuthority.publicKey, null, TOKEN_2022_PROGRAM_ID)
    );
    const newTokenTx = await sendAndConfirmTransaction(connection, mintTransaction, [payer, mintKeypair], {
        skipPreflight: true,
        commitment: 'confirmed',
    });
    console.log("NewToken Created:", generateExplorerTxUrl(newTokenTx));
}

const mintToOwner = async() => {
    // Define the amount to be minted and the amount to be transferred, accounting for decimals
    const mintAmount = BigInt(1_000_000 * 10 ** decimals); // Mint 1,000,000 tokens
    const transferAmount = BigInt(1_000 * 10 ** decimals); // Transfer 1,000 tokens

    const owner = payer;
    const sourceAccount = await createAssociatedTokenAccountIdempotent(connection, payer, mint, owner.publicKey, {}, TOKEN_2022_PROGRAM_ID);
    const mintSig = await mintTo(connection,payer,mint,sourceAccount,mintAuthority,mintAmount,[],undefined,TOKEN_2022_PROGRAM_ID);
    console.log("Tokens Minted:", generateExplorerTxUrl(mintSig));
}
const main = async () => {
    // https://explorer.solana.com/tx/51KJe6PTwh94YBMDfE66Whrp9uwr9ZBi31K9zzPME2CyqzcX4umXnmizchx7f2UGRCcLikS9ApTBza7kFEVuwUfx?cluster=devnet
    // await createToken();
    // https://explorer.solana.com/tx/27UzCyiBeCMMqA6YxoGwALbVUuoA4sP2cdSmvk8motnPWbf47HREA4A3eyPkaLMSzbCi6VqxTSbRsaWhe37UE9GC?cluster=devnet
    // await mintToOwner();
    // https://explorer.solana.com/tx/wcmZs9BbwjPomZsdw63638vF48ocDXdPxQXpVPutQzJ5nuwZcmhwiEfgt3ye3NRvt1FnMfjS7nyKF1h5MLW8F2F?cluster=devnet
    // await initializeExtraAccountMetaList(mint);
    // await addWhitelist(mint, new PublicKey("5RoELXPzGfPFJ8DqHXX6QmgLguYERWfptPC3SUkwCBGz"));
    // await addWhitelist(mint, new PublicKey("Bw6cx4qzWygKDLtbThv8TxESxsUsEXmcv1X4gUPbSycc"));
    // await transfer(mint, wallet.payer, new PublicKey("Bw6cx4qzWygKDLtbThv8TxESxsUsEXmcv1X4gUPbSycc"), BigInt(2000 * 10 ** decimals));
    // console.log(await getAmountPool(mint));
}

main();
