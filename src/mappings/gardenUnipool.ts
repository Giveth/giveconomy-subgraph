import { Staked, Withdrawn } from '../types/Unipool/UnipoolTokenDistributor';
export { handleRewardAdded, handleRewardPaid } from './unipool';
import * as Unipool from './unipool';
import { Address, BigInt, log } from '@graphprotocol/graph-ts';
import {
  getGivPowerSnapshotId,
  getUserEntity,
  getUserUnipoolBalance,
} from '../../src/utils/misc';

import { UserGivPowerSnapshot } from '../../src/types/schema';

function updateSnapshot(
  contractAddress: Address,
  userAddress: Address,
  currentTimestamp: BigInt,
): void {
  const user = getUserEntity(userAddress);
  const userBalance = getUserUnipoolBalance(contractAddress, userAddress);

  const newSnapshotId = getGivPowerSnapshotId(userAddress, currentTimestamp);
  let newSnapshot = UserGivPowerSnapshot.load(newSnapshotId);
  if (!newSnapshot) {
    newSnapshot = new UserGivPowerSnapshot(newSnapshotId);
    newSnapshot.user = userAddress.toHex();
    newSnapshot.timestamp = currentTimestamp;
  }
  const lastSnapshotTimestamp = user.lastGivPowerUpdateTime;

  newSnapshot.givPowerAmount = userBalance.balance;

  if (!lastSnapshotTimestamp.isZero()) {
    const lastSnapshotId = getGivPowerSnapshotId(
      userAddress,
      lastSnapshotTimestamp,
    );

    const lastSnapshot = UserGivPowerSnapshot.load(lastSnapshotId);

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
  }

  newSnapshot.save();

  user.lastGivPowerUpdateTime = currentTimestamp;
  user.save();
}

export function handleStaked(event: Staked): void {
  Unipool.handleStaked(event);
  updateSnapshot(event.address, event.params.user, event.block.timestamp);
}

export function handleWithdrawn(event: Withdrawn): void {
  Unipool.handleWithdrawn(event);
  updateSnapshot(event.address, event.params.user, event.block.timestamp);
}
