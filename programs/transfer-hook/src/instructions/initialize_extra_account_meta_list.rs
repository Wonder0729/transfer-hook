use anchor_lang::{
    prelude::*,
    system_program::{create_account, CreateAccount},
};
use anchor_spl::{
    associated_token::AssociatedToken, token_interface::{Mint, TokenInterface}
};
use spl_tlv_account_resolution::state::ExtraAccountMetaList;
use spl_transfer_hook_interface::instruction::ExecuteInstruction;
use spl_tlv_account_resolution::account::ExtraAccountMeta;
use spl_tlv_account_resolution::seeds::Seed;

use crate::{
    constant::{ADMIN_ADDRESS, AMOUNT_POOL_SEED, EXTRA_ACCOUNT_METAS_SEED},
    error::ContractError, state::AmountPool,
};

#[derive(Accounts)]
pub struct InitializeExtraAccountMetaList<'info> {
    #[account(mut)]
    payer: Signer<'info>,

    /// CHECK: ExtraAccountMetaList Account, must use these seeds
    #[account(
        mut,
        seeds = [EXTRA_ACCOUNT_METAS_SEED.as_ref(), mint.key().as_ref()], 
        bump
    )]
    pub extra_account_meta_list: AccountInfo<'info>,
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(
        init,
        payer = payer,
        space = AmountPool::INIT_SPACE,
        seeds = [AMOUNT_POOL_SEED.as_ref(), mint.key().as_ref()],
        bump
    )]
    pub amount_pool: Account<'info, AmountPool>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn initialize_extra_account_meta_list_handler(ctx: Context<InitializeExtraAccountMetaList>) -> Result<()> {
    let payer = &ctx.accounts.payer;
    require!(payer.key().to_string() == ADMIN_ADDRESS.to_string(), ContractError::InvalidAdminAddress);

    // The `addExtraAccountsToInstruction` JS helper function resolving incorrectly
    let account_metas = vec![
        ExtraAccountMeta::new_with_seeds(
            &[
                Seed::Literal { bytes: AMOUNT_POOL_SEED.as_bytes().to_vec()},
                Seed::AccountKey { index: 1 }
            ],
            false, // is_signer
            true,  // is_writable
        )?,
    ];

    // calculate account size
    let account_size = ExtraAccountMetaList::size_of(account_metas.len())? as u64;
    // calculate minimum required lamports
    let lamports = Rent::get()?.minimum_balance(account_size as usize);

    let mint = ctx.accounts.mint.key();
    let signer_seeds: &[&[&[u8]]] = &[&[
        EXTRA_ACCOUNT_METAS_SEED.as_ref(),
        &mint.as_ref(),
        &[ctx.bumps.extra_account_meta_list],
    ]];

    // create ExtraAccountMetaList account
    create_account(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            CreateAccount {
                from: ctx.accounts.payer.to_account_info(),
                to: ctx.accounts.extra_account_meta_list.to_account_info(),
            },
        ).with_signer(signer_seeds),
        lamports,
        account_size,
        ctx.program_id,
    )?;

    // initialize ExtraAccountMetaList account with extra accounts
    ExtraAccountMetaList::init::<ExecuteInstruction>(
        &mut ctx.accounts.extra_account_meta_list.try_borrow_mut_data()?,
        &account_metas,
    )?;

    Ok(())
}
