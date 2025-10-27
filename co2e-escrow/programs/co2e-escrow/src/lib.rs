use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("FsqvhRRiENRHLncK3GKMitZT1V126pXGpT2dtVEHhMkf");

#[program]
pub mod co2e_escrow {
    use super::*;

    /// Initialize escrow with CO₂e tokens
    /// Only admin can call this
    pub fn initialize(
        ctx: Context<Initialize>,
        price_per_token: u64, // in lamports
    ) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        escrow.admin = ctx.accounts.admin.key();
        escrow.token_mint = ctx.accounts.token_mint.key();
        escrow.escrow_token_account = ctx.accounts.escrow_token_account.key();
        escrow.price_per_token = price_per_token;
        escrow.total_sold = 0;
        escrow.total_revenue = 0;
        escrow.bump = ctx.bumps.escrow;

        msg!("✅ Escrow initialized");
        msg!("   Price: {} lamports per token", price_per_token);

        Ok(())
    }

    /// Buy CO₂e tokens
    /// User pays SOL, gets tokens instantly
    pub fn buy_tokens(
        ctx: Context<BuyTokens>,
        amount: u64, // in tokens (with decimals)
    ) -> Result<()> {
        // Calculate total price
        let total_price = amount
            .checked_mul(ctx.accounts.escrow.price_per_token)
            .ok_or(ErrorCode::Overflow)?
            .checked_div(100) // Adjust for 2 decimals
            .ok_or(ErrorCode::Overflow)?;

        msg!("🛒 Purchasing {} tokens for {} lamports", amount, total_price);

        // Transfer SOL from buyer to admin (project wallet)
        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.buyer.to_account_info(),
                to: ctx.accounts.admin.to_account_info(),
            },
        );
        anchor_lang::system_program::transfer(cpi_context, total_price)?;

        // Transfer tokens from escrow to buyer
        let token_mint = ctx.accounts.escrow.token_mint;
        let bump = ctx.accounts.escrow.bump;
        let seeds = &[
            b"escrow",
            token_mint.as_ref(),
            &[bump],
        ];
        let signer = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.escrow_token_account.to_account_info(),
            to: ctx.accounts.buyer_token_account.to_account_info(),
            authority: ctx.accounts.escrow.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::transfer(cpi_ctx, amount)?;

        // Update stats
        let escrow = &mut ctx.accounts.escrow;
        escrow.total_sold = escrow.total_sold.checked_add(amount).ok_or(ErrorCode::Overflow)?;
        escrow.total_revenue = escrow.total_revenue.checked_add(total_price).ok_or(ErrorCode::Overflow)?;

        emit!(PurchaseEvent {
            buyer: ctx.accounts.buyer.key(),
            amount,
            price: total_price,
            timestamp: Clock::get()?.unix_timestamp,
        });

        msg!("✅ Purchase complete!");
        msg!("   Buyer: {}", ctx.accounts.buyer.key());
        msg!("   Amount: {} tokens", amount);
        msg!("   Price: {} lamports", total_price);

        Ok(())
    }

    /// Update price (admin only)
    pub fn update_price(
        ctx: Context<UpdatePrice>,
        new_price: u64,
    ) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        escrow.price_per_token = new_price;

        msg!("✅ Price updated to {} lamports per token", new_price);

        Ok(())
    }

    /// Withdraw tokens (admin only, for refilling or emergency)
    pub fn withdraw_tokens(
        ctx: Context<WithdrawTokens>,
        amount: u64,
    ) -> Result<()> {
        let escrow = &ctx.accounts.escrow;

        let seeds = &[
            b"escrow",
            escrow.token_mint.as_ref(),
            &[escrow.bump],
        ];
        let signer = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.escrow_token_account.to_account_info(),
            to: ctx.accounts.admin_token_account.to_account_info(),
            authority: ctx.accounts.escrow.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::transfer(cpi_ctx, amount)?;

        msg!("✅ Withdrew {} tokens", amount);

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = admin,
        space = 8 + Escrow::INIT_SPACE,
        seeds = [b"escrow", token_mint.key().as_ref()],
        bump
    )]
    pub escrow: Account<'info, Escrow>,

    #[account(mut)]
    pub admin: Signer<'info>,

    /// CHECK: Token mint address
    pub token_mint: AccountInfo<'info>,

    /// Escrow's token account (holds tokens for sale)
    #[account(mut)]
    pub escrow_token_account: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct BuyTokens<'info> {
    #[account(
        mut,
        seeds = [b"escrow", escrow.token_mint.as_ref()],
        bump = escrow.bump
    )]
    pub escrow: Account<'info, Escrow>,

    #[account(mut)]
    pub buyer: Signer<'info>,

    /// CHECK: Admin receives SOL payment
    #[account(mut)]
    pub admin: AccountInfo<'info>,

    /// Escrow's token account
    #[account(
        mut,
        constraint = escrow_token_account.key() == escrow.escrow_token_account
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,

    /// Buyer's token account
    #[account(mut)]
    pub buyer_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdatePrice<'info> {
    #[account(
        mut,
        seeds = [b"escrow", escrow.token_mint.as_ref()],
        bump = escrow.bump,
        constraint = escrow.admin == admin.key() @ ErrorCode::Unauthorized
    )]
    pub escrow: Account<'info, Escrow>,

    pub admin: Signer<'info>,
}

#[derive(Accounts)]
pub struct WithdrawTokens<'info> {
    #[account(
        mut,
        seeds = [b"escrow", escrow.token_mint.as_ref()],
        bump = escrow.bump,
        constraint = escrow.admin == admin.key() @ ErrorCode::Unauthorized
    )]
    pub escrow: Account<'info, Escrow>,

    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        mut,
        constraint = escrow_token_account.key() == escrow.escrow_token_account
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub admin_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[account]
#[derive(InitSpace)]
pub struct Escrow {
    pub admin: Pubkey,
    pub token_mint: Pubkey,
    pub escrow_token_account: Pubkey,
    pub price_per_token: u64,
    pub total_sold: u64,
    pub total_revenue: u64,
    pub bump: u8,
}

#[event]
pub struct PurchaseEvent {
    pub buyer: Pubkey,
    pub amount: u64,
    pub price: u64,
    pub timestamp: i64,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Unauthorized: Only admin can perform this action")]
    Unauthorized,
    #[msg("Arithmetic overflow")]
    Overflow,
}
