import { Claimed } from '../types/MerkleDistro/MerkleDistro';
import { GIVDROP } from '../utils/constants';
import { TokenDistroBalance } from '../types/schema';
import { updateTokenAllocationDistributor } from '../commons/TokenAllocation';

export const handleClaimed = (event: Claimed): void => {
  const balance = TokenDistroBalance.load(event.params.recipient.toHex());
  updateTokenAllocationDistributor(event.transaction.hash.toHex(), GIVDROP);

  if (balance) {
    balance.givDropClaimed = true;
    balance.save();
  }
};

export const handleOwnershipTransferred = (): void => {};
