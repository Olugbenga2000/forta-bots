import {
  Finding,
  HandleBlock,
  FindingSeverity,
  FindingType,
  BlockEvent,
  ethers,
  EventType,
  Block,
  Network,
  createBlockEvent,
} from "forta-agent";
import { MockEthersProvider } from "forta-agent-tools/lib/mock.utils";
import { provideAgentCreationHandler } from "./agent";

const createBlockEventWithDifficulty = (blockNumber: number, blockDifficulty: string): BlockEvent => {
  const block: Block = {
    difficulty: blockDifficulty,
    number: blockNumber,
  } as any;
  const [type, network] = [EventType.BLOCK, Network.MAINNET];
  return createBlockEvent({ type, network, block });
};

const getMockProvider = (blockNumber: number, blockDifficulty: string): MockEthersProvider =>
  new MockEthersProvider().addBlock(blockNumber, { _difficulty: ethers.BigNumber.from(blockDifficulty) });

describe("block difficulty monitoring test", () => {
  let handleBlock: HandleBlock;
  const THRESHOLD = 20;
  const blockNumber = 30;
  let currentBlockDifficulty: string;
  let previousBlockDifficulty: string;

  it("should return an empty finding if the block difficulty difference is less than the threshold", async () => {
    currentBlockDifficulty = "234";
    previousBlockDifficulty = "230";
    handleBlock = provideAgentCreationHandler(THRESHOLD, getMockProvider(blockNumber - 1, previousBlockDifficulty));
    const currentBlockEvent: BlockEvent = createBlockEventWithDifficulty(blockNumber, currentBlockDifficulty);
    const finding: Finding[] = await handleBlock(currentBlockEvent);

    expect(finding).toStrictEqual([]);
  });

  it("should return an empty finding if the block difficulty difference is equal to the threshold", async () => {
    currentBlockDifficulty = "234";
    previousBlockDifficulty = "254";
    handleBlock = provideAgentCreationHandler(THRESHOLD, getMockProvider(blockNumber - 1, previousBlockDifficulty));
    const currentBlockEvent: BlockEvent = createBlockEventWithDifficulty(blockNumber, currentBlockDifficulty);
    const finding: Finding[] = await handleBlock(currentBlockEvent);

    expect(finding).toStrictEqual([]);
  });

  it("should return a finding if the block difficulty difference is gt the threshold", async () => {
    currentBlockDifficulty = "234";
    previousBlockDifficulty = "200";
    handleBlock = provideAgentCreationHandler(THRESHOLD, getMockProvider(blockNumber - 1, previousBlockDifficulty));
    let currentBlockEvent: BlockEvent = createBlockEventWithDifficulty(blockNumber, currentBlockDifficulty);
    let finding: Finding[] = await handleBlock(currentBlockEvent);

    expect(finding).toStrictEqual([
      Finding.fromObject({
        name: "Difficulty threshold surpassed",
        description: `Block difficulty threshold (${THRESHOLD}) has been surpassed`,
        alertId: "FORTA-1",
        protocol: `${Object.keys(Network)[Object.values(Network).indexOf(currentBlockEvent.network)]}`,
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        metadata: {
          currentBlockNumber: `${blockNumber}`,
          currentBlockDifficulty,
          previousBlockNumber: `${blockNumber - 1}`,
          previousBlockDifficulty,
          difficultyDifference: `${Math.abs(+currentBlockDifficulty - +previousBlockDifficulty)}`,
        },
      }),
    ]);
  });
});
