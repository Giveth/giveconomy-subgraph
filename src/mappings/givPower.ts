import { Address, BigInt, log } from '@graphprotocol/graph-ts';
import {
  TokenLocked,
  TokenUnlocked,
  Upgraded,
  Transfer,
} from '../types/GIVPower/GIVPower';
import { TokenLock, UserGivPowerSnapshot } from '../types/schema';
import {
  getGIVPower,
  getGivPowerSnapshotId,
  getTokenLockId,
  getUserEntity,
  getUserUnipoolBalance,
  updateGivPower,
} from '../utils/misc';
import { MAX_LOCK_ROUNDS } from '../utils/constants';

function updateSnapshot(
  contractAddress: Address,
  userAddress: Address,
  currentTimestamp: BigInt,
): void {
  const user = getUserEntity(userAddress);
  const userBalance = getUserUnipoolBalance(contractAddress, userAddress);

  const lastSnapshotTimestamp = user.lastGivPowerUpdateTime;

  if (!lastSnapshotTimestamp.isZero()) {
    const lastSnapshotId = getGivPowerSnapshotId(
      userAddress,
      lastSnapshotTimestamp,
    );
    const newSnapshotId = getGivPowerSnapshotId(userAddress, currentTimestamp);

    const lastSnapshot = UserGivPowerSnapshot.load(lastSnapshotId);
    let newSnapshot = UserGivPowerSnapshot.load(newSnapshotId);
    if (!newSnapshot) {
      newSnapshot = new UserGivPowerSnapshot(newSnapshotId);
      newSnapshot.timestamp = currentTimestamp;
    }

    newSnapshot.givPowerAmount = userBalance.balance;

    if (!lastSnapshot) {
      log.error('Snapshot was not saved for time {} of user {}', [
        lastSnapshotTimestamp.toString(),
        userAddress.toHex(),
      ]);
    } else {
      newSnapshot.cumulativeGivPowerAmount =
        lastSnapshot.cumulativeGivPowerAmount.plus(
          lastSnapshot.givPowerAmount.times(
            currentTimestamp.minus(lastSnapshot.timestamp),
          ),
        );
    }

    newSnapshot.save();

    user.lastGivPowerUpdateTime = currentTimestamp;
    user.save();
  }
}

export function handleTokenLocked(event: TokenLocked): void {
  const userAddress = event.params.account;
  const lockAmount = event.params.amount;

  const user = getUserEntity(userAddress);
  user.givLocked = user.givLocked.plus(lockAmount);
  user.save();

  const rounds = event.params.rounds.toI32();
  const untilRound = event.params.untilRound.toI32();

  const lockId = getTokenLockId(userAddress, rounds, untilRound);
  let tokenLock = TokenLock.load(lockId);

  const givPower = getGIVPower(event.address);
  const initialDate = givPower.initialDate;
  const roundDuration = givPower.roundDuration;

  if (tokenLock == null) {
    tokenLock = new TokenLock(lockId);
    tokenLock.user = userAddress.toHex();
    tokenLock.untilRound = untilRound;
    tokenLock.rounds = rounds;
    tokenLock.unlocked = false;
    tokenLock.unlockableAt = initialDate.plus(
      BigInt.fromI64((untilRound + 1) * roundDuration),
    );
  }

  tokenLock.amount = tokenLock.amount.plus(lockAmount);
  tokenLock.save();

  givPower.locksCreated += 1;
  givPower.totalGIVLocked = givPower.totalGIVLocked.plus(lockAmount);

  givPower.save();
}

export function handleTokenUnlocked(event: TokenUnlocked): void {
  const userAddress = event.params.account;
  const unlockAmount = event.params.amount;

  const user = getUserEntity(userAddress);
  user.givLocked = user.givLocked.minus(unlockAmount);
  user.save();

  const givpower = getGIVPower(event.address);
  givpower.totalGIVLocked = givpower.totalGIVLocked.minus(unlockAmount);
  givpower.save();

  const round = event.params.round.toI32();
  for (let i = 0; i <= MAX_LOCK_ROUNDS; i += 1) {
    const lockId = getTokenLockId(userAddress, i, round);
    const tokenLock = TokenLock.load(lockId);
    if (tokenLock) {
      tokenLock.unlockedAt = event.block.timestamp;
      tokenLock.amount = BigInt.zero();
      tokenLock.unlocked = true;
      tokenLock.save();
    }
  }
}

export function handleUpgrade(event: Upgraded): void {
  updateGivPower(event.address);
}

export function handleTransfer(event: Transfer): void {
  const fromAddress = event.params.from;
  const toAddress = event.params.to;

  if (fromAddress.toHex() != Address.zero().toHex()) {
    updateSnapshot(event.address, fromAddress, event.block.timestamp);
  }

  if (toAddress.toHex() != Address.zero().toHex()) {
    updateSnapshot(event.address, toAddress, event.block.timestamp);
  }
}
