use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenAccount};

use crate::{
    constant::{AMOUNT_POOL_SEED, EXTRA_ACCOUNT_METAS_SEED},
    state::AmountPool,
};

// Order of accounts matters for this struct.
// The first 4 accounts are the accounts required for token transfer (source, mint, destination, owner)
// Remaining accounts are the extra accounts required from the ExtraAccountMetaList account
// These accounts are provided via CPI to this program from the token2022 program
#[derive(Accounts)]
pub struct TransferHook<'info> {
    #[account(
        token::mint = mint, 
        token::authority = owner,
    )]
    pub source_token: InterfaceAccount<'info, TokenAccount>,
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(
        token::mint = mint,
    )]
    pub destination_token: InterfaceAccount<'info, TokenAccount>,
    /// CHECK: source token account owner, can be SystemAccount or PDA owned by another program
    pub owner: UncheckedAccount<'info>,
    /// CHECK: ExtraAccountMetaList Account,
    #[account(
        seeds = [EXTRA_ACCOUNT_METAS_SEED.as_ref(), mint.key().as_ref()], 
        bump
    )]
    pub extra_account_meta_list: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [AMOUNT_POOL_SEED.as_ref(), mint.key().as_ref()],
        bump
    )]
    pub amount_pool: Account<'info, AmountPool>,
}

pub fn transfer_hook_handler(ctx: Context<TransferHook>, amount: u64) -> Result<()> {
    let amount_pool = &mut ctx.accounts.amount_pool;
    let mint = &ctx.accounts.mint;
    let owner = &ctx.accounts.owner;
    msg!("transfer hook called: mint: {} owner: {} amount: {}", mint.key().to_string(), owner.key().to_string(), amount);

    amount_pool.add_amount(owner.key(), amount)
}