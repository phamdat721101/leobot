import { InlineKeyboard } from "grammy";

export const mainmenu_board = new InlineKeyboard()
  .text("Funding Management 📋", "trade_board")
  .row()
  .text("Manage Wallet 📤", "setting_wallet")
  .row()
  .text("Give feedback 📬", "feedback")
  .row();

export const withdraw_board = new InlineKeyboard()
  .text("amount💰", "amount")
  .row()
  .text("Withdraw", "confirm_withdraw")
  .row()
  .text("Main menu", "main")
  .row();

export const withdraw_apt = new InlineKeyboard()
  .text("Withdraw", "place_withdraw")
  .row()
  .text("Main menu", "main")
  .row();

export const setting_board = new InlineKeyboard()
  .text("Main", "main")  
  .row()
  .text("Withdraw APT", "withdraw_apt")
  .row()
  .text("Reset Wallet", "reset_wallet")
  .text("Export Seed Phrase", "export_seed_phrase")
  .row()

export const request_board = new InlineKeyboard()
  .text("Main", "main")
  .row()
  .text("Stake", "stake")
  .row()
  .text("Mint 1 VDot", "vdot")
  .text("Mint 1 VManta", "vManta")
  // .text("Prev", "prev_ts")
  // .text("Next", "next_ts")
  .row()
  .text("Unstake", "unstake")
  .row()
