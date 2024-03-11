use anchor_lang::prelude::*;

#[error_code]
pub enum ContractError {
    /// address already exist
    #[msg("address already exist")]
    AddressAlreadyExist,
    /// exceed max address
    #[msg("exceed max address")]
    ExceedMaxAddress,
    /// invalid admin address
    #[msg("invalid admin address")]
    InvalidAdminAddress,
    /// address don't exist in whitelist
    #[msg("address don't exist in whitelist")]
    NotExistAddress,
}
