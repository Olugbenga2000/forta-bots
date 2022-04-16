import { Finding, HandleTransaction, FindingSeverity, FindingType, TransactionEvent } from "forta-agent";
import { createAddress } from "forta-agent-tools/lib/tests.utils";

export type functionParam = {
  address: string;
  name: string;
};

export const ERC721_TRANSFER_EVENT =
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)";

const FORTA_ADDRESS: functionParam = {
  address: "0x61447385B019187daa48e91c55c02AF1F1f3F863",
  name: "FORTA",
};

const NETHERMIND_DEPLOYER: functionParam = {
  address: "0x88dC3a2284FA62e0027d6D6B1fCfDd2141a143b8",
  name: "NETHERMIND",
};

export function provideAgentCreationHandler(deployer: functionParam, bot_address: functionParam): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    // filter the transaction logs for forta transfer events
    const fortaTransferEvents = txEvent.filterLog(ERC721_TRANSFER_EVENT, bot_address.address);

    fortaTransferEvents.forEach((transferEvent) => {
      // extract transfer event arguments
      const { from, to, tokenId } = transferEvent.args;
      // if the from address is address(0) and the deployer is nethermind, report it
      if (from === createAddress("0x0") && to === deployer.address) {
        findings.push(
          Finding.fromObject({
            name: "New agent",
            description: `A bot has been created by ${deployer.name}`,
            alertId: "FORTA-1",
            protocol: deployer.name,
            severity: FindingSeverity.Info,
            type: FindingType.Info,
            metadata: {
              tokenId: `${tokenId}`,
              deployer: deployer.name,
            },
          })
        );
      }
    });

    return findings;
  };
}

const handleTransaction = provideAgentCreationHandler(NETHERMIND_DEPLOYER, FORTA_ADDRESS);

export default {
  handleTransaction,
};
