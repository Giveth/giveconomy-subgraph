import { Address } from '@graphprotocol/graph-ts';
import {
  RewardAdded,
  RewardPaid,
  Staked,
  UnipoolTokenDistributor as UnipoolContract,
  Withdrawn,
} from '../types/Unipool/UnipoolTokenDistributor';
import { UNISWAP_POOL } from '../utils/constants';
import { getUnipool, getUserUnipoolBalance } from '../utils/misc';
import { TransactionTokenAllocation, TokenAllocation } from '../types/schema';

function updateReward(address: Address, userAddress: Address): void {
  const unipool = getUnipool(address);
  const contract = UnipoolContract.bind(Address.fromString(unipool.id));

  const callRewardPerTokenStored = contract.try_rewardPerTokenStored();
  if (!callRewardPerTokenStored.reverted) {
    unipool.rewardPerTokenStored = callRewardPerTokenStored.value;
  }

  const callLastUpdateDate = contract.try_lastUpdateTime();

  if (!callLastUpdateDate.reverted) {
    unipool.lastUpdateTime = callLastUpdateDate.value;
  }
  unipool.save();

  if (userAddress.toHex() != Address.zero().toHex()) {
    const userUnipoolBalance = getUserUnipoolBalance(address, userAddress);
    userUnipoolBalance.rewards = contract.rewards(userAddress);
    userUnipoolBalance.rewardPerTokenPaid =
      contract.userRewardPerTokenPaid(userAddress);
    userUnipoolBalance.save();
  }
}

export function handleRewardAdded(event: RewardAdded): void {
  updateReward(event.address, Address.zero());
}

export function handleRewardPaid(event: RewardPaid): void {
  updateReward(event.address, event.params.user);
  updateTokenAllocationDistributor(
    event.transaction.hash.toHex(),
    UNISWAP_POOL,
  );
}

export function handleStaked(event: Staked): void {
  updateReward(event.address, event.params.user);

  const unipool = getUnipool(event.address);
  unipool.totalSupply = unipool.totalSupply.plus(event.params.amount);
  unipool.save();

  const userBalance = getUserUnipoolBalance(event.address, event.params.user);
  userBalance.balance = userBalance.balance.plus(event.params.amount);
  userBalance.save();
}

export function handleWithdrawn(event: Withdrawn): void {
  updateReward(event.address, event.params.user);

  const unipool = getUnipool(event.address);
  unipool.totalSupply = unipool.totalSupply.minus(event.params.amount);
  unipool.save();

  const userBalance = getUserUnipoolBalance(event.address, event.params.user);
  userBalance.balance = userBalance.balance.minus(event.params.amount);
  userBalance.save();
}

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
