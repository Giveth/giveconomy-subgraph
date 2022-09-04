import { RewardPaid } from '../../types/UniswapV3RewardToken/UniswapV3RewardToken';
import { updateTokenAllocationDistributor } from '../../utils/tokenDistroHelper';
import { UNISWAP_V3 } from '../../utils/constants';

export function handleRewardPaid(event: RewardPaid): void {
  updateTokenAllocationDistributor(event.transaction.hash.toHex(), UNISWAP_V3);
}

export function handleApproval(): void {}
export function handleOwnershipTransferred(): void {}
export function handleTransfer(): void {}
