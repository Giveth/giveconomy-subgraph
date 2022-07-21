import { BigInt } from '@graphprotocol/graph-ts';
import { TokenDistroBalance } from '../types/schema';

export function addAllocatedTokens(
  to: string,
  value: BigInt,
  tokenAddress: string,
): void {
  const id = tokenAddress + '-' + to;
  let allocatedBalance = TokenDistroBalance.load(id);
  if (!allocatedBalance) {
    allocatedBalance = new TokenDistroBalance(id);
  }
  allocatedBalance.allocatedTokens =
    allocatedBalance.allocatedTokens.plus(value);
  allocatedBalance.allocationCount = allocatedBalance.allocationCount.plus(
    BigInt.fromI32(1),
  );
  allocatedBalance.save();
}

export function addClaimed(
  to: string,
  value: BigInt,
  tokenAddress: string,
): void {
  const id = tokenAddress + '-' + to;
  let toBalance = TokenDistroBalance.load(id);

  if (!toBalance) {
    toBalance = new TokenDistroBalance(id);
  }
  toBalance.claimed = toBalance.claimed.plus(value);
  toBalance.givback = BigInt.zero();
  toBalance.givbackLiquidPart = BigInt.zero();
  toBalance.save();
}
