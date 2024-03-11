use anchor_lang::prelude::*;
use spl_transfer_hook_interface::instruction::TransferHookInstruction;

mod state;
mod constant;
mod error;
mod instructions;

use instructions::*;

declare_id!("7XZAbVvb2Ubu8SUEPKkE7nBYT8qedoPjhmFSnQ3VFYzr");

#[program]
pub mod transfer_hook {
    use super::*;
    pub fn add_whitelist(ctx: Context<AddWhiteList>, address: Pubkey) -> Result<()> {
        add_whitelist_handler(ctx, address)
    }

    pub fn remove_whitelist(ctx: Context<RemoveWhiteList>, address: Pubkey) -> Result<()> {
        remove_whitelist_handler(ctx, address)
    }

    pub fn update_amount(ctx: Context<UpdateAmount>, address: Pubkey, amount: u64) -> Result<()> {
        update_amount_handler(ctx, address, amount)
    }

    pub fn initialize_extra_account_meta_list(ctx: Context<InitializeExtraAccountMetaList>) -> Result<()> {
        initialize_extra_account_meta_list_handler(ctx)
    }

    pub fn transfer_hook(ctx: Context<TransferHook>, amount: u64) -> Result<()> {
        transfer_hook_handler(ctx, amount)
    }

    // fallback instruction handler as workaround to anchor instruction discriminator check
    pub fn fallback<'info>(
        program_id: &Pubkey,
        accounts: &'info [AccountInfo<'info>],
        data: &[u8],
    ) -> Result<()> {
        let instruction = TransferHookInstruction::unpack(data)?;

        // match instruction discriminator to transfer hook interface execute instruction
        // token2022 program CPIs this instruction on token transfer
        match instruction {
            TransferHookInstruction::Execute { amount } => {
                let amount_bytes = amount.to_le_bytes();

                // invoke custom transfer hook instruction on our program
                __private::__global::transfer_hook(program_id, accounts, &amount_bytes)
            }
            _ => return Err(ProgramError::InvalidInstructionData.into()),
        }
    }
}

