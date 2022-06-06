import { BigInt } from '@graphprotocol/graph-ts';
import {
  GardenTokenLocked,
  GardenTokenUnlocked,
  PowerLocked,
  PowerUnlocked,
} from '../types/GIVPower/GIVPower';
import { PowerLock } from '../types/schema';
import { getGIVPower, getPowerLockId, getUserEntity } from '../utils/misc';
import { MAX_LOCK_ROUNDS } from '../utils/constants';

export function handlePowerLocked(event: PowerLocked): void {
  const userAddress = event.params.account;
  const powerAmount = event.params.powerAmount;
  const user = getUserEntity(userAddress);
  user.givPower = user.givPower.plus(powerAmount);
  user.save();

  const rounds = event.params.rounds.toI32();
  const untilRound = event.params.untilRound.toI32();

  const lockId = getPowerLockId(userAddress, rounds, untilRound);
  let powerLock = PowerLock.load(lockId);

  const givpower = getGIVPower(event.address);
  const initialDate = givpower.initialDate;
  const roundDuration = givpower.roundDuration;

  if (powerLock == null) {
    powerLock = new PowerLock(lockId);
    powerLock.user = userAddress.toHex();
    powerLock.untilRound = untilRound;
    powerLock.rounds = rounds;
    powerLock.unlocked = false;
    powerLock.unlockableAt = initialDate + untilRound * roundDuration;

    givpower.locksCreated += 1;
    givpower.totalGIVPower = givpower.totalGIVPower.plus(powerAmount);

    givpower.save();
  }

  powerLock.amount = powerLock.amount.plus(powerAmount);

  powerLock.save();
}

export function handlePowerUnlocked(event: PowerUnlocked): void {
  const userAddress = event.params.account;
  const powerAmount = event.params.powerAmount;
  const user = getUserEntity(userAddress);
  user.givPower = user.givPower.minus(powerAmount);
  user.save();

  const givpower = getGIVPower(event.address);
  givpower.totalGIVPower = givpower.totalGIVPower.minus(powerAmount);
  givpower.save();

  const round = event.params.round.toI32();
  for (let i = 0; i <= MAX_LOCK_ROUNDS; i += 1) {
    const lockId = getPowerLockId(userAddress, i, round);
    const powerLock = PowerLock.load(lockId);
    if (powerLock) {
      powerLock.unlockedAt = event.block.timestamp.toI32();
      powerLock.amount = BigInt.zero();
      powerLock.unlocked = true;
      powerLock.save();
    }
  }
}

export function handleGardenTokenLocked(event: GardenTokenLocked): void {
  const userAddress = event.params.account;
  const givAmount = event.params.amount;
  const user = getUserEntity(userAddress);
  user.givLocked = user.givLocked.plus(givAmount);
  user.save();

  const givpower = getGIVPower(event.address);
  givpower.totalGIVLocked = givpower.totalGIVLocked.plus(givAmount);
  givpower.save();
}

export function handleGardenTokenUnlocked(event: GardenTokenUnlocked): void {
  const userAddress = event.params.account;
  const givAmount = event.params.amount;
  const user = getUserEntity(userAddress);
  user.givLocked = user.givLocked.minus(givAmount);
  user.save();

  const givpower = getGIVPower(event.address);
  givpower.totalGIVLocked = givpower.totalGIVLocked.minus(givAmount);
  givpower.save();
}
