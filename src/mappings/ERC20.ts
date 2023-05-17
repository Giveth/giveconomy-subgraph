import { Address } from '@graphprotocol/graph-ts';
import { Transfer } from '../types/ERC20/ERC20';
import { getUserTokenBalance, recordBalanceChange } from '../utils/misc';

export function handleTransfer(event: Transfer): void {
  const fromAddress = event.params.from;
  const toAddress = event.params.to;
  const amount = event.params.value;

  if (fromAddress.toHex() != Address.zero().toHex()) {
    const fromBalance = getUserTokenBalance(event.address, fromAddress);
    fromBalance.balance = fromBalance.balance.minus(amount);
    fromBalance.updatedAt = event.block.timestamp;
    fromBalance.save();
    recordBalanceChange(event, fromAddress, amount.neg(), fromBalance.balance);
  }

  if (toAddress.toHex() != Address.zero().toHex()) {
    const toBalance = getUserTokenBalance(event.address, toAddress);
    toBalance.balance = toBalance.balance.plus(amount);
    toBalance.updatedAt = event.block.timestamp;
    toBalance.save();
    recordBalanceChange(event, toAddress, amount, toBalance.balance);
  }
}
