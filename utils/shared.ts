import { getData, utils, v2, v3, OpenAttestationDocument, WrappedDocument } from "@tradetrust-tt/tradetrust";
import { getSupportedChainIds } from "../src/common/utils/chain-utils";
import { AvailableBlockChains, BurnAddress, ChainId } from "../src/constants/chain-info";
import { TitleEscrow__factory, TradeTrustToken__factory } from "@tradetrust-tt/token-registry/contracts";
import { TitleEscrowInterface } from "../src/common/contexts/TokenInformationContext";
import { getCurrentProvider } from "../src/common/contexts/provider";
import { ethers } from "ethers";

export type WrappedOrSignedOpenAttestationDocument = WrappedDocument<OpenAttestationDocument>;
// note that the return type for getting attachments will normalise the structure into v2.Attachment
export type OpenAttestationAttachment = v2.Attachment;

export const getOpenAttestationData = (
  wrappedDocument: WrappedDocument<OpenAttestationDocument>
): OpenAttestationDocument => utils.getDocumentData(wrappedDocument);

export const getTemplateUrl = (rawDocument: WrappedOrSignedOpenAttestationDocument): string | undefined => {
  if (utils.isWrappedV2Document(rawDocument)) {
    const documentData = getData(rawDocument);
    return typeof documentData.$template === "object" ? documentData.$template.url : undefined;
  } else if (utils.isWrappedV3Document(rawDocument)) {
    return rawDocument.openAttestationMetadata.template?.url;
  }
  // disable v4 verification for the time being
  // else {
  //   return rawDocument.renderMethod?.url;
  // }
};

export const getAttachments = (rawDocument: WrappedOrSignedOpenAttestationDocument): v2.Attachment[] | undefined => {
  if (utils.isWrappedV2Document(rawDocument)) {
    const documentData = getData(rawDocument);
    return documentData.attachments;
  } else if (utils.isWrappedV3Document(rawDocument)) {
    return rawDocument.attachments?.map((attachment: v3.Attachment) => {
      return {
        data: attachment.data,
        filename: attachment.fileName,
        type: attachment.mimeType,
      };
    });
  } else {
    // attachments not included in v4 schema for now.
    return [];
  }
};

export const getTokenRegistryAddress = (document: WrappedOrSignedOpenAttestationDocument): string | undefined => {
  const issuerAddress = utils.getIssuerAddress(document);
  return issuerAddress instanceof Array ? issuerAddress[0] : issuerAddress;
};

export const getChainId = (rawDocument: WrappedOrSignedOpenAttestationDocument): ChainId | undefined => {
  const throwError = () => {
    throw new Error("Invalid Document, please use a valid document.");
  };

  function processChainId(document: v2.OpenAttestationDocument | v3.OpenAttestationDocument): number | undefined {
    if (document.network) {
      // Check for current blockchain, "ETH" or "MATIC", and chainId, if need cater for other blockchain and network, update this accordingly.
      if (AvailableBlockChains.includes(document.network.chain) && document.network.chainId) {
        const networks: ChainId[] = getSupportedChainIds();
        const chainIdNumber = parseInt(document.network.chainId);
        const isChainIdInListedNetwork = networks.includes(chainIdNumber);
        if (!chainIdNumber || !isChainIdInListedNetwork) throwError();
        return chainIdNumber;
      }
      throwError();
    }
    console.warn(
      "You are using an older version of Open-Attestation Document, to use the auto network feature, please use an updated version. Otherwise, please make sure that you select the correct network."
    );
    return undefined;
  }

  if (utils.isWrappedV2Document(rawDocument)) {
    const documentData = getData(rawDocument);
    // Check for DID, ignore chainId when its DID
    const identityProofType = documentData.issuers[0].identityProof?.type;
    if (identityProofType === "DNS-DID" || identityProofType === "DID") return undefined;
    return processChainId(documentData);
  } else if (utils.isWrappedV3Document(rawDocument)) {
    // Check for DID, ignore chainId when its DID
    const identityProofType = rawDocument.openAttestationMetadata.identityProof.type;
    if (identityProofType === "DNS-DID" || identityProofType === "DID") return undefined;
    return processChainId(rawDocument);
  } else {
    // for now v4 is only DID method so ignore chainID
    return undefined;
  }
};

export async function isTokenRegistryV5(registryAddress: string, tokenId: string): Promise<boolean> {
  try {
    const provider = getCurrentProvider();
    if (!provider) {
      return false;
    }
    const tokenRegistry = TradeTrustToken__factory.connect(registryAddress, provider);
    const titleEscrowOwner = await tokenRegistry.ownerOf(tokenId);
    const inactiveEscrow = [BurnAddress, registryAddress]
      .map((s) => s.toLowerCase())
      .includes(titleEscrowOwner.toLowerCase());
    let titleEscrowAddress = titleEscrowOwner;
    if (inactiveEscrow) {
      const titleEscrowFactoryAddress = await tokenRegistry.titleEscrowFactory();
      const tokenRegistryAddress = await tokenRegistry?.address;
      // Resolve V5 TitleEscrowFactory__factory contract function rename from getAddress to getEscrowAddress
      const titleEscrowFactory = new ethers.Contract(
        titleEscrowFactoryAddress,
        `[{"inputs":[{"internalType":"address","name":"tokenRegistry","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"getEscrowAddress","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"}]`,
        provider
      );
      titleEscrowAddress = await titleEscrowFactory.getEscrowAddress(tokenRegistryAddress, tokenId);
    }
    const titleEscrow = TitleEscrow__factory.connect(titleEscrowAddress, provider);
    const isTitleEscrowV5 = await titleEscrow.supportsInterface(TitleEscrowInterface.V5);
    return isTitleEscrowV5;
  } catch (error) {
    return false;
  }
}
