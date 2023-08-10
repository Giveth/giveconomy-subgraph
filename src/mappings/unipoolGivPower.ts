import {
  DepositTokenDeposited,
  DepositTokenWithdrawn,
} from '../types/UnipoolGIVPower/UnipoolGIVPower';
import { getUserTokenBalance, recordBalanceChange } from '../utils/misc';

export {
  handleTokenUnlocked,
  handleTokenLocked,
  handleUpgrade,
} from './givPower';

export function handleDepositTokenDeposited(
  event: DepositTokenDeposited,
): void {
  const account = event.params.account;
  const balance = getUserTokenBalance(event.address, account);
  const amount = event.params.amount;
  balance.balance = balance.balance.plus(amount);
  balance.updatedAt = event.block.timestamp;
  balance.save();
  recordBalanceChange(event, account, amount, balance.balance);
}

export function handleDepositTokenWithdrawn(
  event: DepositTokenWithdrawn,
): void {
  const account = event.params.account;
  const balance = getUserTokenBalance(event.address, account);
  const amount = event.params.amount;
  balance.balance = balance.balance.minus(amount);
  balance.updatedAt = event.block.timestamp;
  balance.save();
  recordBalanceChange(event, account, amount.neg(), balance.balance);
}
