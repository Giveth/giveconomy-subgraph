import { Address, BigInt, dataSource, ethereum } from '@graphprotocol/graph-ts';
import {
  GIVPower,
  TokenBalance,
  User,
  Unipool,
  UnipoolBalance,
  BalanceChange,
  TokenLock,
} from '../types/schema';
import { GIVPower as GIVPowerContract } from '../types/GIVPower/GIVPower';
import { UnipoolTokenDistributor as UnipoolContract } from '../types/Unipool/UnipoolTokenDistributor';
import { TO_UPDATE_GIV_POWER_LOCKS_IDS } from '../utils/optimismGivPowerLocks';

export function getUserEntity(userAddress: Address): User {
  let user = User.load(userAddress.toHex());

  if (user == null) {
    user = new User(userAddress.toHex());
    user.givLocked = BigInt.zero();
    user.lastGivPowerUpdateTime = BigInt.zero();
    user.save();
  }

  return user;
}

export function getGIVPower(givPowerAddress: Address): GIVPower {
  let givpower = GIVPower.load(givPowerAddress.toHex());

  if (givpower == null) {
    givpower = new GIVPower(givPowerAddress.toHex());
    const givPowerContract = GIVPowerContract.bind(givPowerAddress);
    const dateCall = givPowerContract.try_INITIAL_DATE();
    const durationCall = givPowerContract.try_ROUND_DURATION();

    let initialDate = dateCall.reverted ? BigInt.zero() : dateCall.value;
    let roundDuration = durationCall.reverted ? 0 : durationCall.value.toI32();

    givpower.initialDate = initialDate;
    givpower.roundDuration = roundDuration;
    givpower.locksCreated = 0;
    givpower.totalGIVLocked = BigInt.zero();
    givpower.save();
  }

  return givpower;
}

export function updateGivPowerLocks(givPowerAddress: Address): void {
  const network = dataSource.network();
  if (network == 'optimism') {
    const givPowerContract = GIVPowerContract.bind(givPowerAddress);
    const dateCall = givPowerContract.try_INITIAL_DATE();
    const durationCall = givPowerContract.try_ROUND_DURATION();

    const initialDate = dateCall.reverted ? BigInt.zero() : dateCall.value;
    const roundDuration = durationCall.reverted
      ? 0
      : durationCall.value.toI32();

    for (let i = 0; i < TO_UPDATE_GIV_POWER_LOCKS_IDS.length; i += 1) {
      const lock = TokenLock.load(TO_UPDATE_GIV_POWER_LOCKS_IDS[i]);
      if (!lock) continue;
      lock.unlockableAt = initialDate.plus(
        BigInt.fromI64((lock.untilRound + 1) * roundDuration),
      );
      lock.save();
    }
  }
}

export function updateGivPower(givPowerAddress: Address): void {
  const givPower = getGIVPower(givPowerAddress);

  const givPowerContract = GIVPowerContract.bind(givPowerAddress);
  const dateCall = givPowerContract.try_INITIAL_DATE();
  const durationCall = givPowerContract.try_ROUND_DURATION();

  const initialDate = dateCall.reverted ? BigInt.zero() : dateCall.value;
  const roundDuration = durationCall.reverted ? 0 : durationCall.value.toI32();

  givPower.initialDate = initialDate;
  givPower.roundDuration = roundDuration;

  givPower.save();

  updateGivPowerLocks(givPowerAddress);
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
    tokenBalance.balance = BigInt.zero();
    tokenBalance.updatedAt = BigInt.zero();
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
    unipoolBalance.balance = BigInt.zero();
    unipoolBalance.rewards = BigInt.zero();
    unipoolBalance.rewardPerTokenPaid = BigInt.zero();
    unipoolBalance.updatedAt = BigInt.zero();
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
    unipool.totalSupply = BigInt.zero();
    unipool.save();
  }

  return unipool;
}

export function getGivPowerSnapshotId(
  userAddress: Address,
  timestamp: BigInt,
): string {
  return userAddress.toHex() + '-' + timestamp.toString();
}

export function getGiversPFPTokenId(
  contractAddress: Address,
  tokenId: i32,
): string {
  return contractAddress.toHex() + '-' + tokenId.toString();
}

export function recordBalanceChange(
  event: ethereum.Event,
  account: Address,
  amount: BigInt,
  newBalance: BigInt,
): void {
  const contractAddress = event.address.toHex();
  const block = event.block;

  // Key is contractAddress-blockNumber-transactionIndex-logIndex
  const id = `${contractAddress}-${block.number}-${padZeroLeft(
    event.transaction.index.toString(),
    4,
  )}-${padZeroLeft(event.logIndex.toString(), 4)}`;

  const balanceChange = new BalanceChange(id);
  balanceChange.account = account.toHex();
  balanceChange.contractAddress = contractAddress;
  balanceChange.time = block.timestamp;
  balanceChange.block = block.number;
  balanceChange.amount = amount;
  balanceChange.newBalance = newBalance;
  balanceChange.save();
}

export function padLeft(str: string, len: i32, char: string): string {
  while (str.length < len) {
    str = char + str;
  }
  return str;
}

export function padZeroLeft(str: string, len: i32): string {
  return padLeft(str, len, '0');
}
