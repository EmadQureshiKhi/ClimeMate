/**
 * ClimeMate MPC Program
 * 
 * Solana program that invokes encrypted computations on the Arcium Network.
 * Uses Anchor framework with Arcium extensions.
 * 
 * To build: arcium build
 * To test: arcium test
 * To deploy: arcium deploy --cluster-offset <offset>
 */

use anchor_lang::prelude::*;
use arcium_anchor::prelude::*;
use arcium_client::idl::arcium::types::CallbackAccount;

// Replace with your actual program ID after deployment
declare_id!("11111111111111111111111111111111");

// Computation definition offsets (unique IDs for each encrypted instruction)
// These must match the function names in encrypted-ixs/src/lib.rs
const COMP_DEF_OFFSET_INIT_EMISSIONS: u32 = comp_def_offset("init_emissions_certificate");
const COMP_DEF_OFFSET_UPDATE_EMISSIONS: u32 = comp_def_offset("update_emissions");
const COMP_DEF_OFFSET_PROVE: u32 = comp_def_offset("prove_threshold");
const COMP_DEF_OFFSET_INIT_SEMA: u32 = comp_def_offset("init_sema_report");
const COMP_DEF_OFFSET_UPDATE_SEMA: u32 = comp_def_offset("update_sema_report");
const COMP_DEF_OFFSET_SEMA_PROVE: u32 = comp_def_offset("prove_sema_compliance");
const COMP_DEF_OFFSET_OFFSET_PCT: u32 = comp_def_offset("calculate_offset_percentage");
const COMP_DEF_OFFSET_ADD: u32 = comp_def_offset("add_together");

const SIGN_PDA_SEED: &[u8] = b"sign_pda";

#[arcium_program]
pub mod climemate_mpc {
    use super::*;

    // ============================================================================
    // Initialization Instructions (call once after deployment)
    // ============================================================================

    pub fn init_emissions_comp_def(ctx: Context<InitEmissionsCompDef>) -> Result<()> {
        init_comp_def(ctx.accounts, true, 0, None, None)?;
        Ok(())
    }

    pub fn init_prove_comp_def(ctx: Context<InitProveCompDef>) -> Result<()> {
        init_comp_def(ctx.accounts, true, 0, None, None)?;
        Ok(())
    }

    pub fn init_sema_comp_def(ctx: Context<InitSemaCompDef>) -> Result<()> {
        init_comp_def(ctx.accounts, true, 0, None, None)?;
        Ok(())
    }

    // ============================================================================
    // Certificate Operations
    // ============================================================================

    /// Initialize encrypted emissions certificate storage
    pub fn init_emissions_certificate(
        ctx: Context<InitEmissionsCertificate>,
        computation_offset: u64,
        nonce: u128,
    ) -> Result<()> {
        let args = vec![Argument::PlaintextU128(nonce)];

        ctx.accounts.sign_pda_account.bump = ctx.bumps.sign_pda_account;

        // Initialize encrypted emissions storage through MPC
        queue_computation(
            ctx.accounts,
            computation_offset,
            args,
            None,
            vec![InitEmissionsCertificateCallback::callback_ix(&[])],
        )?;
        Ok(())
    }

    #[arcium_callback(encrypted_ix = "init_emissions_certificate")]
    pub fn init_emissions_certificate_callback(
        ctx: Context<InitEmissionsCertificateCallback>,
        output: ComputationOutputs<InitEmissionsCertificateOutput>,
    ) -> Result<()> {
        let _emissions = match output {
            ComputationOutputs::Success(InitEmissionsCertificateOutput { field_0 }) => field_0,
            _ => return Err(ErrorCode::AbortedComputation.into()),
        };

        emit!(EmissionsCertificateInitialized {
            timestamp: Clock::get()?.unix_timestamp,
        });
        Ok(())
    }

    /// Prove emissions below threshold (ZK proof)
    pub fn prove_threshold(
        ctx: Context<ProveThreshold>,
        computation_offset: u64,
        threshold: u64,
    ) -> Result<()> {
        let args = vec![
            Argument::PlaintextU64(threshold),
        ];

        ctx.accounts.sign_pda_account.bump = ctx.bumps.sign_pda_account;

        queue_computation(
            ctx.accounts,
            computation_offset,
            args,
            None,
            vec![ProveThresholdCallback::callback_ix(&[])],
        )?;
        Ok(())
    }

    #[arcium_callback(encrypted_ix = "prove_threshold")]
    pub fn prove_threshold_callback(
        ctx: Context<ProveThresholdCallback>,
        output: ComputationOutputs<ProveThresholdOutput>,
    ) -> Result<()> {
        let meets_threshold = match output {
            ComputationOutputs::Success(ProveThresholdOutput { field_0 }) => field_0,
            _ => return Err(ErrorCode::AbortedComputation.into()),
        };

        // Emit event with ZK proof result (boolean only, not actual values)
        emit!(ThresholdProved {
            meets_threshold,
            timestamp: Clock::get()?.unix_timestamp,
        });
        Ok(())
    }

    // ============================================================================
    // SEMA Operations
    // ============================================================================

    /// Initialize encrypted SEMA report storage
    pub fn init_sema_report(
        ctx: Context<InitSemaReport>,
        computation_offset: u64,
        nonce: u128,
    ) -> Result<()> {
        let args = vec![Argument::PlaintextU128(nonce)];

        ctx.accounts.sign_pda_account.bump = ctx.bumps.sign_pda_account;

        queue_computation(
            ctx.accounts,
            computation_offset,
            args,
            None,
            vec![InitSemaReportCallback::callback_ix(&[])],
        )?;
        Ok(())
    }

    #[arcium_callback(encrypted_ix = "init_sema_report")]
    pub fn init_sema_report_callback(
        ctx: Context<InitSemaReportCallback>,
        output: ComputationOutputs<InitSemaReportOutput>,
    ) -> Result<()> {
        let _report = match output {
            ComputationOutputs::Success(InitSemaReportOutput { field_0 }) => field_0,
            _ => return Err(ErrorCode::AbortedComputation.into()),
        };

        emit!(SemaReportInitialized {
            timestamp: Clock::get()?.unix_timestamp,
        });
        Ok(())
    }

    /// Prove SEMA compliance without revealing score
    pub fn prove_sema_compliance(
        ctx: Context<ProveSemaCompliance>,
        computation_offset: u64,
        threshold: u64,
    ) -> Result<()> {
        let args = vec![
            Argument::PlaintextU64(threshold),
        ];

        ctx.accounts.sign_pda_account.bump = ctx.bumps.sign_pda_account;

        queue_computation(
            ctx.accounts,
            computation_offset,
            args,
            None,
            vec![ProveSemaComplianceCallback::callback_ix(&[])],
        )?;
        Ok(())
    }

    #[arcium_callback(encrypted_ix = "prove_sema_compliance")]
    pub fn prove_sema_compliance_callback(
        ctx: Context<ProveSemaComplianceCallback>,
        output: ComputationOutputs<ProveSemaComplianceOutput>,
    ) -> Result<()> {
        let meets_threshold = match output {
            ComputationOutputs::Success(ProveSemaComplianceOutput { field_0 }) => field_0,
            _ => return Err(ErrorCode::AbortedComputation.into()),
        };

        emit!(SemaComplianceProved {
            meets_threshold,
            timestamp: Clock::get()?.unix_timestamp,
        });
        Ok(())
    }
}

// ============================================================================
// Events
// ============================================================================

#[event]
pub struct EmissionsCertificateInitialized {
    pub timestamp: i64,
}

#[event]
pub struct ThresholdProved {
    pub meets_threshold: bool,
    pub timestamp: i64,
}

#[event]
pub struct SemaReportInitialized {
    pub timestamp: i64,
}

#[event]
pub struct SemaComplianceProved {
    pub meets_threshold: bool,
    pub timestamp: i64,
}

// ============================================================================
// Error Codes
// ============================================================================

#[error_code]
pub enum ErrorCode {
    #[msg("Computation was aborted")]
    AbortedComputation,
    #[msg("Cluster not set")]
    ClusterNotSet,
}

// ============================================================================
// Account Structs - Initialization
// ============================================================================

#[init_computation_definition_accounts("init_emissions_certificate", payer)]
#[derive(Accounts)]
pub struct InitEmissionsCompDef<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        mut,
        address = derive_mxe_pda!()
    )]
    pub mxe_account: Box<Account<'info, MXEAccount>>,
    #[account(mut)]
    /// CHECK: comp_def_account, checked by arcium program.
    /// Can't check it here as it's not initialized yet.
    pub comp_def_account: UncheckedAccount<'info>,
    pub arcium_program: Program<'info, Arcium>,
    pub system_program: Program<'info, System>,
}

#[init_computation_definition_accounts("prove_threshold", payer)]
#[derive(Accounts)]
pub struct InitProveCompDef<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        mut,
        address = derive_mxe_pda!()
    )]
    pub mxe_account: Box<Account<'info, MXEAccount>>,
    #[account(mut)]
    /// CHECK: comp_def_account, checked by arcium program.
    /// Can't check it here as it's not initialized yet.
    pub comp_def_account: UncheckedAccount<'info>,
    pub arcium_program: Program<'info, Arcium>,
    pub system_program: Program<'info, System>,
}

#[init_computation_definition_accounts("init_sema_report", payer)]
#[derive(Accounts)]
pub struct InitSemaCompDef<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        mut,
        address = derive_mxe_pda!()
    )]
    pub mxe_account: Box<Account<'info, MXEAccount>>,
    #[account(mut)]
    /// CHECK: comp_def_account, checked by arcium program.
    /// Can't check it here as it's not initialized yet.
    pub comp_def_account: UncheckedAccount<'info>,
    pub arcium_program: Program<'info, Arcium>,
    pub system_program: Program<'info, System>,
}

// ============================================================================
// Account Structs - Emissions Operations
// ============================================================================

#[queue_computation_accounts("init_emissions_certificate", payer)]
#[derive(Accounts)]
#[instruction(computation_offset: u64)]
pub struct InitEmissionsCertificate<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init_if_needed,
        space = 9,
        payer = payer,
        seeds = [&SIGN_PDA_SEED],
        bump,
        address = derive_sign_pda!(),
    )]
    pub sign_pda_account: Account<'info, SignerAccount>,
    #[account(
        address = derive_mxe_pda!()
    )]
    pub mxe_account: Account<'info, MXEAccount>,
    #[account(
        mut,
        address = derive_mempool_pda!()
    )]
    /// CHECK: mempool_account, checked by the arcium program
    pub mempool_account: UncheckedAccount<'info>,
    #[account(
        mut,
        address = derive_execpool_pda!()
    )]
    /// CHECK: executing_pool, checked by the arcium program
    pub executing_pool: UncheckedAccount<'info>,
    #[account(
        mut,
        address = derive_comp_pda!(computation_offset)
    )]
    /// CHECK: computation_account, checked by the arcium program
    pub computation_account: UncheckedAccount<'info>,
    #[account(
        address = derive_comp_def_pda!(COMP_DEF_OFFSET_INIT_EMISSIONS)
    )]
    pub comp_def_account: Account<'info, ComputationDefinitionAccount>,
    #[account(
        mut,
        address = derive_cluster_pda!(mxe_account)
    )]
    pub cluster_account: Account<'info, Cluster>,
    #[account(
        mut,
        address = ARCIUM_FEE_POOL_ACCOUNT_ADDRESS,
    )]
    pub pool_account: Account<'info, FeePool>,
    #[account(
        address = ARCIUM_CLOCK_ACCOUNT_ADDRESS
    )]
    pub clock_account: Account<'info, ClockAccount>,
    pub system_program: Program<'info, System>,
    pub arcium_program: Program<'info, Arcium>,
}

#[callback_accounts("init_emissions_certificate")]
#[derive(Accounts)]
pub struct InitEmissionsCertificateCallback<'info> {
    pub arcium_program: Program<'info, Arcium>,
    #[account(
        address = derive_comp_def_pda!(COMP_DEF_OFFSET_INIT_EMISSIONS)
    )]
    pub comp_def_account: Account<'info, ComputationDefinitionAccount>,
    #[account(address = ::anchor_lang::solana_program::sysvar::instructions::ID)]
    /// CHECK: instructions_sysvar, checked by the account constraint
    pub instructions_sysvar: AccountInfo<'info>,
}

#[queue_computation_accounts("prove_threshold", payer)]
#[derive(Accounts)]
#[instruction(computation_offset: u64)]
pub struct ProveThreshold<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init_if_needed,
        space = 9,
        payer = payer,
        seeds = [&SIGN_PDA_SEED],
        bump,
        address = derive_sign_pda!(),
    )]
    pub sign_pda_account: Account<'info, SignerAccount>,
    #[account(
        address = derive_mxe_pda!()
    )]
    pub mxe_account: Account<'info, MXEAccount>,
    #[account(
        mut,
        address = derive_mempool_pda!()
    )]
    /// CHECK: mempool_account, checked by the arcium program
    pub mempool_account: UncheckedAccount<'info>,
    #[account(
        mut,
        address = derive_execpool_pda!()
    )]
    /// CHECK: executing_pool, checked by the arcium program
    pub executing_pool: UncheckedAccount<'info>,
    #[account(
        mut,
        address = derive_comp_pda!(computation_offset)
    )]
    /// CHECK: computation_account, checked by the arcium program
    pub computation_account: UncheckedAccount<'info>,
    #[account(
        address = derive_comp_def_pda!(COMP_DEF_OFFSET_PROVE)
    )]
    pub comp_def_account: Account<'info, ComputationDefinitionAccount>,
    #[account(
        mut,
        address = derive_cluster_pda!(mxe_account)
    )]
    pub cluster_account: Account<'info, Cluster>,
    #[account(
        mut,
        address = ARCIUM_FEE_POOL_ACCOUNT_ADDRESS,
    )]
    pub pool_account: Account<'info, FeePool>,
    #[account(
        address = ARCIUM_CLOCK_ACCOUNT_ADDRESS
    )]
    pub clock_account: Account<'info, ClockAccount>,
    pub system_program: Program<'info, System>,
    pub arcium_program: Program<'info, Arcium>,
}

#[callback_accounts("prove_threshold")]
#[derive(Accounts)]
pub struct ProveThresholdCallback<'info> {
    pub arcium_program: Program<'info, Arcium>,
    #[account(
        address = derive_comp_def_pda!(COMP_DEF_OFFSET_PROVE)
    )]
    pub comp_def_account: Account<'info, ComputationDefinitionAccount>,
    #[account(address = ::anchor_lang::solana_program::sysvar::instructions::ID)]
    /// CHECK: instructions_sysvar, checked by the account constraint
    pub instructions_sysvar: AccountInfo<'info>,
}

// ============================================================================
// Account Structs - SEMA Operations
// ============================================================================

#[queue_computation_accounts("init_sema_report", payer)]
#[derive(Accounts)]
#[instruction(computation_offset: u64)]
pub struct InitSemaReport<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init_if_needed,
        space = 9,
        payer = payer,
        seeds = [&SIGN_PDA_SEED],
        bump,
        address = derive_sign_pda!(),
    )]
    pub sign_pda_account: Account<'info, SignerAccount>,
    #[account(
        address = derive_mxe_pda!()
    )]
    pub mxe_account: Account<'info, MXEAccount>,
    #[account(
        mut,
        address = derive_mempool_pda!()
    )]
    /// CHECK: mempool_account, checked by the arcium program
    pub mempool_account: UncheckedAccount<'info>,
    #[account(
        mut,
        address = derive_execpool_pda!()
    )]
    /// CHECK: executing_pool, checked by the arcium program
    pub executing_pool: UncheckedAccount<'info>,
    #[account(
        mut,
        address = derive_comp_pda!(computation_offset)
    )]
    /// CHECK: computation_account, checked by the arcium program
    pub computation_account: UncheckedAccount<'info>,
    #[account(
        address = derive_comp_def_pda!(COMP_DEF_OFFSET_INIT_SEMA)
    )]
    pub comp_def_account: Account<'info, ComputationDefinitionAccount>,
    #[account(
        mut,
        address = derive_cluster_pda!(mxe_account)
    )]
    pub cluster_account: Account<'info, Cluster>,
    #[account(
        mut,
        address = ARCIUM_FEE_POOL_ACCOUNT_ADDRESS,
    )]
    pub pool_account: Account<'info, FeePool>,
    #[account(
        address = ARCIUM_CLOCK_ACCOUNT_ADDRESS
    )]
    pub clock_account: Account<'info, ClockAccount>,
    pub system_program: Program<'info, System>,
    pub arcium_program: Program<'info, Arcium>,
}

#[callback_accounts("init_sema_report")]
#[derive(Accounts)]
pub struct InitSemaReportCallback<'info> {
    pub arcium_program: Program<'info, Arcium>,
    #[account(
        address = derive_comp_def_pda!(COMP_DEF_OFFSET_INIT_SEMA)
    )]
    pub comp_def_account: Account<'info, ComputationDefinitionAccount>,
    #[account(address = ::anchor_lang::solana_program::sysvar::instructions::ID)]
    /// CHECK: instructions_sysvar, checked by the account constraint
    pub instructions_sysvar: AccountInfo<'info>,
}

#[queue_computation_accounts("prove_sema_compliance", payer)]
#[derive(Accounts)]
#[instruction(computation_offset: u64)]
pub struct ProveSemaCompliance<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init_if_needed,
        space = 9,
        payer = payer,
        seeds = [&SIGN_PDA_SEED],
        bump,
        address = derive_sign_pda!(),
    )]
    pub sign_pda_account: Account<'info, SignerAccount>,
    #[account(
        address = derive_mxe_pda!()
    )]
    pub mxe_account: Account<'info, MXEAccount>,
    #[account(
        mut,
        address = derive_mempool_pda!()
    )]
    /// CHECK: mempool_account, checked by the arcium program
    pub mempool_account: UncheckedAccount<'info>,
    #[account(
        mut,
        address = derive_execpool_pda!()
    )]
    /// CHECK: executing_pool, checked by the arcium program
    pub executing_pool: UncheckedAccount<'info>,
    #[account(
        mut,
        address = derive_comp_pda!(computation_offset)
    )]
    /// CHECK: computation_account, checked by the arcium program
    pub computation_account: UncheckedAccount<'info>,
    #[account(
        address = derive_comp_def_pda!(COMP_DEF_OFFSET_SEMA_PROVE)
    )]
    pub comp_def_account: Account<'info, ComputationDefinitionAccount>,
    #[account(
        mut,
        address = derive_cluster_pda!(mxe_account)
    )]
    pub cluster_account: Account<'info, Cluster>,
    #[account(
        mut,
        address = ARCIUM_FEE_POOL_ACCOUNT_ADDRESS,
    )]
    pub pool_account: Account<'info, FeePool>,
    #[account(
        address = ARCIUM_CLOCK_ACCOUNT_ADDRESS
    )]
    pub clock_account: Account<'info, ClockAccount>,
    pub system_program: Program<'info, System>,
    pub arcium_program: Program<'info, Arcium>,
}

#[callback_accounts("prove_sema_compliance")]
#[derive(Accounts)]
pub struct ProveSemaComplianceCallback<'info> {
    pub arcium_program: Program<'info, Arcium>,
    #[account(
        address = derive_comp_def_pda!(COMP_DEF_OFFSET_SEMA_PROVE)
    )]
    pub comp_def_account: Account<'info, ComputationDefinitionAccount>,
    #[account(address = ::anchor_lang::solana_program::sysvar::instructions::ID)]
    /// CHECK: instructions_sysvar, checked by the account constraint
    pub instructions_sysvar: AccountInfo<'info>,
}
