import { Claimed } from '../types/MerkleDistro/MerkleDistro';
import { GIVDROP } from '../utils/constants';
import { TokenAllocation, TransactionTokenAllocation } from '../types/schema';
import {
  getTokenDistroBalance,
  updateTokenAllocationDistributor,
} from '../../src/utils/tokenDistroHelper';

export function handleClaimed(event: Claimed): void {
  updateTokenAllocationDistributor(event.transaction.hash.toHex(), GIVDROP);

  const transactionTokenAllocations = TransactionTokenAllocation.load(
    event.transaction.hash.toHex(),
  );

  if (!transactionTokenAllocations) {
    return;
  }
  for (
    let i = 0;
    i < transactionTokenAllocations.tokenAllocationIds.length;
    i++
  ) {
    const tokenAllocation = TokenAllocation.load(
      transactionTokenAllocations.tokenAllocationIds[i],
    );
    if (!tokenAllocation) {
      continue;
    }

    if (
      tokenAllocation.recipient == event.params.recipient.toHex() &&
      tokenAllocation.amount.equals(event.params.amount)
    ) {
      const tokenDistroBalance = getTokenDistroBalance(
        tokenAllocation.tokenDistroAddress,
        tokenAllocation.recipient,
      );

      if (tokenDistroBalance) {
        tokenDistroBalance.givDropClaimed = true;
        tokenDistroBalance.save();
      }
    }
  }
}

export const handleOwnershipTransferred = (): void => {};
