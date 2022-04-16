import {
  Finding,
  HandleBlock,
  FindingSeverity,
  FindingType,
  BlockEvent,
  ethers,
  getJsonRpcUrl,
  Network,
} from "forta-agent";
import { MockEthersProvider } from "forta-agent-tools/lib/mock.utils";

type blockDetails = {
  blockNumber: number;
  network: Network;
  block: {
    difficulty: string;
  };
};

const getProvider = (): ethers.providers.JsonRpcProvider => new ethers.providers.JsonRpcProvider(getJsonRpcUrl());

const THRESHOLD = 6559585103933;

export function provideAgentCreationHandler(
  threshold: number,
  provider: ethers.providers.JsonRpcProvider | MockEthersProvider
): HandleBlock {
  return async (blockEvent: BlockEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    // get the current block details from the block event
    const {
      blockNumber,
      network,
      block: { difficulty },
    }: blockDetails = blockEvent;

    // get the current previous block difficukty using jsonRpcProvider
    const prevBlockDifficulty: ethers.BigNumber = (await provider.getBlock(blockNumber - 1))._difficulty;
    // get the difference in difficulty between the current and previous block
    const difference: ethers.BigNumber = ethers.BigNumber.from(difficulty).sub(prevBlockDifficulty).abs();
    // If the difficulty difference is greater than the threshold, return a finding
    if (difference.gt(threshold)) {
      findings.push(
        Finding.fromObject({
          name: "Difficulty threshold surpassed",
          description: `Block difficulty threshold (${threshold}) has been surpassed`,
          alertId: "FORTA-1",
          protocol: `${Object.keys(Network)[Object.values(Network).indexOf(+network)]}`,
          severity: FindingSeverity.Info,
          type: FindingType.Info,
          metadata: {
            currentBlockNumber: `${blockNumber}`,
            currentBlockDifficulty: `${ethers.BigNumber.from(difficulty)}`,
            previousBlockNumber: `${blockNumber - 1}`,
            previousBlockDifficulty: `${prevBlockDifficulty}`,
            difficultyDifference: `${difference}`,
          },
        })
      );
    }
    return findings;
  };
}

const handleBlock = provideAgentCreationHandler(THRESHOLD, getProvider());

export default {
  handleBlock,
};
