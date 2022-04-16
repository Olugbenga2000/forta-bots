import { Finding, HandleTransaction, FindingSeverity, FindingType, TransactionEvent } from "forta-agent";
import { ERC721_TRANSFER_EVENT, provideAgentCreationHandler, functionParam } from "./agent";
import { createAddress, TestTransactionEvent } from "forta-agent-tools/lib/tests.utils";
import { encodeParameter } from "forta-agent-tools/lib/utils";

const BOT_ADDRESS: functionParam = {
  address: createAddress("0x5893"),
  name: "TEST",
};

const BOT_DEPLOYER: functionParam = {
  address: createAddress("0x48937"),
  name: "TEST PROTOCOL",
};

const createTransactionEventWithTransferLog = (
  tokenAddress: string,
  from: string,
  to: string,
  tokenId: string
): TransactionEvent => {
  const fromTopic: string = encodeParameter("address", from);
  const toTopic: string = encodeParameter("address", to);
  const tokenIdTopic: string = encodeParameter("uint256", tokenId);
  return new TestTransactionEvent().addEventLog(
    "Transfer(address,address,uint256)",
    tokenAddress,
    "0x",
    fromTopic,
    toTopic,
    tokenIdTopic
  );
};

describe("New agent deployment tests", () => {
  let handleTransaction: HandleTransaction;

  it("should return empty findings if there are no erc721 transfer events", async () => {
    handleTransaction = provideAgentCreationHandler(BOT_DEPLOYER, BOT_ADDRESS);
    const txEvent: TransactionEvent = new TestTransactionEvent().addEventLog("badSignature");
    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return empty findings if there are no erc721 mint events", async () => {
    handleTransaction = provideAgentCreationHandler(BOT_DEPLOYER, BOT_ADDRESS);
    const txEvent: TransactionEvent = createTransactionEventWithTransferLog(
      BOT_ADDRESS.address,
      createAddress("0x3765"),
      BOT_DEPLOYER.address,
      "13789403024637"
    );
    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it(`should return empty findings if there is a mint event but the deployer isnt ${BOT_DEPLOYER.name}`, async () => {
    handleTransaction = provideAgentCreationHandler(BOT_DEPLOYER, BOT_ADDRESS);
    const txEvent: TransactionEvent = createTransactionEventWithTransferLog(
      BOT_ADDRESS.address,
      createAddress("0x0"),
      createAddress("0x6ca54"),
      "13789403024637"
    );
    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([]);
  });

  it(`should return a finding if there is a mint event deployed from ${BOT_DEPLOYER.name}`, async () => {
    handleTransaction = provideAgentCreationHandler(BOT_DEPLOYER, BOT_ADDRESS);
    const txEvent: TransactionEvent = createTransactionEventWithTransferLog(
      BOT_ADDRESS.address,
      createAddress("0x0"),
      BOT_DEPLOYER.address,
      "13789403024637"
    );
    const findings: Finding[] = await handleTransaction(txEvent);

    expect(findings).toStrictEqual([
      Finding.fromObject({
        name: "New agent",
        description: `A bot has been created by ${BOT_DEPLOYER.name}`,
        alertId: "FORTA-1",
        protocol: BOT_DEPLOYER.name,
        severity: FindingSeverity.Info,
        type: FindingType.Info,
        metadata: {
          tokenId: "13789403024637",
          deployer: BOT_DEPLOYER.name,
        },
      }),
    ]);
  });
});
