use anchor_lang::prelude::*;

use crate::{
    constant::MAX_ADDRESS_IN_WHITELIST,
    error::*
};

#[account]
#[derive(InitSpace, Default)]
pub struct AmountPool {
    #[max_len(MAX_ADDRESS_IN_WHITELIST)]
    pub whitelist: Vec<SentAmount>,               // 4 + 40 * 1000
}

#[derive(InitSpace, Default, AnchorDeserialize, AnchorSerialize, Clone, Copy)]
pub struct SentAmount {
    pub address: Pubkey,
    pub amount: u64,
}

impl AmountPool {
    pub fn add_whitelist(&mut self, address: Pubkey) -> Result<()> {
        require!(self.whitelist.iter().all(|&x| x.address != address), ContractError::AddressAlreadyExist);
        require!(self.whitelist.len() < MAX_ADDRESS_IN_WHITELIST, ContractError::ExceedMaxAddress);
        self.whitelist.push(SentAmount { address, amount: 0 });
        Ok(())
    }

    pub fn remove_whitelist(&mut self, address: Pubkey) -> Result<()> {
        self.whitelist.retain(|&x| x.address != address);
        Ok(())
    }

    pub fn reduce_amount(&mut self, address: Pubkey, amount: u64) -> Result<()> {
        if let Some(value) = self.whitelist.iter_mut().find(|x| x.address == address) {
            value.amount = value.amount.checked_sub(amount).unwrap();
            Ok(())
        } else {
            Err(ContractError::NotExistAddress.into())
        }
    }

    pub fn add_amount(&mut self, address: Pubkey, amount: u64) -> Result<()> {
        if let Some(value) = self.whitelist.iter_mut().find(|x| x.address == address) {
            value.amount = value.amount.checked_add(amount).unwrap();
        }
        Ok(())
    }
}