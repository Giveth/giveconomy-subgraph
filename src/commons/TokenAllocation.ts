import { TransactionTokenAllocation, TokenAllocation } from '../types/schema';

export function updateTokenAllocationDistributor(
  txHash: string,
  distributor: string,
): void {
  const transactionTokenAllocations = TransactionTokenAllocation.load(txHash);
  if (!transactionTokenAllocations) {
    return;
  }
  for (
    let i = 0;
    i < transactionTokenAllocations.tokenAllocationIds.length;
    i++
  ) {
    const entity = TokenAllocation.load(
      transactionTokenAllocations.tokenAllocationIds[i],
    );
    if (!entity) {
      continue;
    }
    entity.distributor = distributor;
    entity.save();
  }
}
