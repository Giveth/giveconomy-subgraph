import {
  GardenTokenLocked,
  GardenTokenUnlocked,
  PowerLocked,
  PowerUnlocked,
} from '../types/GIVPower/GIVPower';
import { PowerLock } from '../types/schema';
import { ZERO_BD } from '../utils/constants';
import { scaleDown } from '../utils/math';
import { getGIVPower, getPowerLockId, getUserEntity } from '../utils/misc';

export function handlePowerLocked(event: PowerLocked): void {
  const userAddress = event.params.account;
  const powerAmount = scaleDown(event.params.powerAmount);
  const user = getUserEntity(userAddress);
  user.givPower = user.givPower.plus(powerAmount);
  user.save();

  const rounds = event.params.rounds.toI32();
  const untilRound = event.params.untilRound.toI32();

  const lockId = getPowerLockId(userAddress, untilRound);
  let powerLock = PowerLock.load(lockId);

  const givpower = getGIVPower();
  const initialDate = givpower.initialDate;
  const roundDuration = givpower.roundDuration;

  if (powerLock == null) {
    powerLock = new PowerLock(lockId);
    powerLock.user = userAddress.toHex();
    powerLock.untilRound = untilRound;
    powerLock.rounds = rounds;
    powerLock.unlocked = false;

    givpower.locksCreated += 1;
    givpower.totalGIVPower = givpower.totalGIVPower.plus(powerAmount);
    givpower.save();
  }

  powerLock.amount = powerLock.amount.plus(powerAmount);
  powerLock.unlockableAt = initialDate + untilRound * roundDuration;

  powerLock.save();
}

export function handlePowerUnlocked(event: PowerUnlocked): void {
  const userAddress = event.params.account;
  const powerAmount = scaleDown(event.params.powerAmount);
  const user = getUserEntity(userAddress);
  user.givPower = user.givPower.minus(powerAmount);
  user.save();

  const lockId = getPowerLockId(userAddress, event.params.round.toI32());
  const powerLock = PowerLock.load(lockId) as PowerLock;
  powerLock.unlockedAt = event.block.timestamp.toI32();
  powerLock.amount = ZERO_BD;
  powerLock.unlocked = true;
  powerLock.save();

  const givpower = getGIVPower();
  givpower.totalGIVPower = givpower.totalGIVPower.minus(powerAmount);
  givpower.save();
}

export function handleGardenTokenLocked(event: GardenTokenLocked): void {
  const userAddress = event.params.account;
  const givAmount = scaleDown(event.params.amount);
  const user = getUserEntity(userAddress);
  user.givLocked = user.givLocked.plus(givAmount);
  user.save();

  const givpower = getGIVPower();
  givpower.totalGIVLocked = givpower.totalGIVLocked.plus(givAmount);
  givpower.save();
}

export function handleGardenTokenUnlocked(event: GardenTokenUnlocked): void {
  const userAddress = event.params.account;
  const givAmount = scaleDown(event.params.amount);
  const user = getUserEntity(userAddress);
  user.givLocked = user.givLocked.minus(givAmount);
  user.save();

  const givpower = getGIVPower();
  givpower.totalGIVLocked = givpower.totalGIVLocked.minus(givAmount);
  givpower.save();
}
