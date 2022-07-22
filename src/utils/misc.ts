import { Address, BigInt } from '@graphprotocol/graph-ts';
import {
  GIVPower,
  TokenBalance,
  User,
  Unipool,
  UnipoolBalance,
  TransactionTokenAllocation,
  TokenAllocation,
  TokenDistroBalance,
} from '../types/schema';
import { GIVPower as GIVPowerContract } from '../types/GIVPower/GIVPower';
import { UnipoolTokenDistributor as UnipoolContract } from '../types/Unipool/UnipoolTokenDistributor';

export function getUserEntity(userAddress: Address): User {
  let user = User.load(userAddress.toHex());

  if (user == null) {
    user = new User(userAddress.toHex());
    user.save();
  }

  return user;
}

export function getGIVPower(givPowerAddress: Address): GIVPower {
  let givpower = GIVPower.load(givPowerAddress.toHex());

  if (givpower == null) {
    givpower = new GIVPower(givPowerAddress.toHex());
    const givPowerContract = GIVPowerContract.bind(givPowerAddress);
    const dateCall = givPowerContract.try_initialDate();
    const durationCall = givPowerContract.try_roundDuration();

    let initialDate = dateCall.reverted ? BigInt.zero() : dateCall.value;
    let roundDuration = durationCall.reverted ? 0 : durationCall.value.toI32();

    givpower.initialDate = initialDate;
    givpower.roundDuration = roundDuration;
    givpower.locksCreated = 0;
    givpower.save();
  }

  return givpower;
}

export function updateGivPower(givPowerAddress: Address): void {
  const givPower = getGIVPower(givPowerAddress);

  const givPowerContract = GIVPowerContract.bind(givPowerAddress);
  const dateCall = givPowerContract.try_initialDate();
  const durationCall = givPowerContract.try_roundDuration();

  let initialDate = dateCall.reverted ? BigInt.zero() : dateCall.value;
  let roundDuration = durationCall.reverted ? 0 : durationCall.value.toI32();

  givPower.initialDate = initialDate;
  givPower.roundDuration = roundDuration;

  givPower.save();
}

export function getTokenLockId(
  userAddress: Address,
  rounds: i32,
  untilRound: i32,
): string {
  return (
    userAddress.toHex() + '-' + rounds.toString() + '-' + untilRound.toString()
  );
}

export function getUserTokenBalance(
  tokenAddress: Address,
  userAddress: Address,
): TokenBalance {
  // To generate user entity if not exists
  getUserEntity(userAddress);

  const id = tokenAddress.toHex() + '-' + userAddress.toHex();
  let tokenBalance = TokenBalance.load(id);

  if (tokenBalance == null) {
    tokenBalance = new TokenBalance(id);
    tokenBalance.token = tokenAddress.toHex();
    tokenBalance.user = userAddress.toHex();
    tokenBalance.save();
  }

  return tokenBalance;
}

export function getUserUnipoolBalance(
  unipoolAddress: Address,
  userAddress: Address,
): UnipoolBalance {
  // To generate user entity if not exists
  getUserEntity(userAddress);

  const id = unipoolAddress.toHex() + '-' + userAddress.toHex();
  let unipoolBalance = UnipoolBalance.load(id);

  if (unipoolBalance == null) {
    unipoolBalance = new UnipoolBalance(id);
    unipoolBalance.unipool = unipoolAddress.toHex();
    unipoolBalance.user = userAddress.toHex();
    unipoolBalance.rewards = BigInt.zero();
    unipoolBalance.rewardPerTokenPaid = BigInt.zero();
    unipoolBalance.save();
  }

  return unipoolBalance;
}

export function getUnipool(address: Address): Unipool {
  let unipool = Unipool.load(address.toHex());

  if (unipool == null) {
    unipool = new Unipool(address.toHex());

    const contract = UnipoolContract.bind(address);
    unipool.lastUpdateTime = contract.lastUpdateTime();
    unipool.periodFinish = contract.periodFinish();
    unipool.rewardPerTokenStored = contract.rewardPerTokenStored();
    unipool.rewardRate = contract.rewardRate();
    unipool.totalSupply = contract.totalSupply();
    unipool.save();
  }

  return unipool;
}

export function saveTokenAllocation(
  recipient: string,
  txHash: string,
  logIndex: BigInt,
  amount: BigInt,
  timestamp: BigInt,
  tokenDistroAddress: string,
): void {
  let transactionTokenAllocations = TransactionTokenAllocation.load(txHash);
  if (!transactionTokenAllocations) {
    transactionTokenAllocations = new TransactionTokenAllocation(txHash);
  }
  const tokenAllocationIds =
    transactionTokenAllocations.tokenAllocationIds || [];
  const entityId = `${txHash}-${logIndex}`;
  const entity = new TokenAllocation(entityId);
  entity.amount = amount;
  entity.timestamp = timestamp;
  entity.recipient = recipient;
  entity.txHash = txHash;
  entity.tokenDistroAddress = tokenDistroAddress;
  entity.save();
  tokenAllocationIds.push(entityId);
  transactionTokenAllocations.tokenAllocationIds = tokenAllocationIds;
  transactionTokenAllocations.save();
}

export function getTokenDistroBalance(
  tokenDistro: Address,
): TokenDistroBalance {
  const address = tokenDistro.toHex();
  let tokenDistroBalance = TokenDistroBalance.load(address);

  if (!tokenDistroBalance) {
    tokenDistroBalance = new TokenDistroBalance(address);
  }

  return tokenDistroBalance;
}
