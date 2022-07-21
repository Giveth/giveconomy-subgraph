import { BigInt } from '@graphprotocol/graph-ts';
import { TokenBalance } from '../types/schema';

export function addAllocatedTokens(
  to: string,
  value: BigInt,
  tokenAddress: string,
): void {
  const id = tokenAddress + '-' + to;
  let tokenBalance = TokenBalance.load(id);
  if (!tokenBalance) {
    tokenBalance = new TokenBalance(id);
  }
  tokenBalance.balance = tokenBalance.balance.plus(value);
  tokenBalance.token = tokenAddress;
  tokenBalance.user = to;
  tokenBalance.save();
}

export function addClaimed(
  to: string,
  value: BigInt,
  tokenAddress: string,
): void {
  const id = tokenAddress + '-' + to;
  let toBalance = TokenBalance.load(id);

  if (!toBalance) {
    toBalance = new TokenBalance(id);
  }
  // Can I do this?
  //   toBalance.claimed = toBalance.claimed.plus(value);
  toBalance.claimed = value;
  toBalance.givback = BigInt.zero();
  toBalance.givbackLiquidPart = BigInt.zero();
  toBalance.save();
}
