use anchor_lang::prelude::*;
use anchor_spl::token_interface::Mint;

use crate::{
    constant::{ADMIN_ADDRESS, AMOUNT_POOL_SEED},
    error::ContractError,
    state::AmountPool,
};

#[derive(Accounts)]
pub struct RemoveWhiteList<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        mut,
        seeds = [AMOUNT_POOL_SEED.as_ref(), mint.key().as_ref()],
        bump
    )]
    pub amount_pool: Account<'info, AmountPool>,
    pub mint: InterfaceAccount<'info, Mint>,
}

pub fn remove_whitelist_handler(
    ctx: Context<RemoveWhiteList>,
    address: Pubkey,
) -> Result<()> {
    let admin = &ctx.accounts.admin;
    let amount_pool = &mut ctx.accounts.amount_pool;
    require!(admin.key().to_string() == ADMIN_ADDRESS.to_string(), ContractError::InvalidAdminAddress);

    amount_pool.remove_whitelist(address)
}
