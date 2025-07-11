"use client";
import { ContractFunctionState, useContractFunctionHook } from "@govtechsg/ethers-contract-hook";
// import { TitleEscrow, TradeTrustToken } from "@tradetrust-tt/token-registry/contracts";
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  FunctionComponent,
} from "react";
import { useTitleEscrowContract } from "../../hooks/useTitleEscrowContract";
import { useProviderContext } from "../provider";
import { useSupportsInterface } from "../../hooks/useSupportsInterface";
import { useTokenRegistryContract } from "../../hooks/useTokenRegistryContract";
import { useRestoreToken } from "../../hooks/useRestoreToken";
import { BurnAddress } from "../../../constants/chain-info";

interface TokenInformationContext {
  tokenRegistryAddress?: string;
  tokenId?: string;
  beneficiary?: string;
  holder?: string;
  documentOwner?: string;
  approvedBeneficiary?: string;
  changeHolder: (...args: any[]) => any;
  changeHolderState: ContractFunctionState;
  surrender: (...args: any[]) => any;
  surrenderState: ContractFunctionState;
  endorseBeneficiary: (...args: any[]) => any;
  endorseBeneficiaryState: ContractFunctionState;
  nominate: (...args: any[]) => any;
  nominateState: ContractFunctionState;
  transferOwners: (...args: any[]) => any;
  transferOwnersState: ContractFunctionState;
  initialize: (tokenRegistryAddress: string, tokenId: string) => void;
  isSurrendered: boolean;
  isTokenBurnt: boolean;
  isTitleEscrow?: boolean;
  resetStates: () => void;
  destroyToken: (...args: any[]) => any;
  destroyTokenState: ContractFunctionState;
  restoreToken: () => Promise<void>;
  restoreTokenState: ContractFunctionState;
}

const contractFunctionStub = () => {};

export const TokenInformationContext = createContext<TokenInformationContext>({
  initialize: () => {},
  changeHolder: contractFunctionStub,
  changeHolderState: "UNINITIALIZED",
  surrender: contractFunctionStub,
  surrenderState: "UNINITIALIZED",
  endorseBeneficiary: contractFunctionStub,
  endorseBeneficiaryState: "UNINITIALIZED",
  isSurrendered: false,
  isTokenBurnt: false,
  documentOwner: "",
  nominate: contractFunctionStub,
  nominateState: "UNINITIALIZED",
  transferOwners: contractFunctionStub,
  transferOwnersState: "UNINITIALIZED",
  resetStates: () => {},
  destroyToken: contractFunctionStub,
  destroyTokenState: "UNINITIALIZED",
  restoreToken: async () => {},
  restoreTokenState: "UNINITIALIZED",
});

interface TokenInformationContextProviderProps {
  children: React.ReactNode;
}

export const TitleEscrowInterface = {
  V4: "0x079dff60",
  V5: "0x3e143f7b",
};

export const TokenInformationContextProvider: FunctionComponent<TokenInformationContextProviderProps> = ({
  children,
}) => {
  const [tokenId, setTokenId] = useState<string>();
  const [tokenRegistryAddress, setTokenRegistryAddress] = useState<string>();
  const { providerOrSigner } = useProviderContext();
  const { tokenRegistry } = useTokenRegistryContract(tokenRegistryAddress, providerOrSigner);
  const { titleEscrow, updateTitleEscrow, documentOwner } = useTitleEscrowContract(
    providerOrSigner,
    tokenRegistry,
    tokenId
  );

  const isSurrendered = documentOwner === tokenRegistryAddress;
  const isTokenBurnt = documentOwner === BurnAddress;

  const { isInterfaceType: isTitleEscrow } = useSupportsInterface(titleEscrow, "0x079dff60");

  const { call: getHolder, value: holder } = useContractFunctionHook(titleEscrow, "holder");
  const { call: getBeneficiary, value: beneficiary } = useContractFunctionHook(titleEscrow, "beneficiary");
  const { call: getApprovedBeneficiary, value: approvedBeneficiary } = useContractFunctionHook(titleEscrow, "nominee");

  const {
    send: destroyToken,
    state: destroyTokenState,
    reset: resetDestroyingTokenState,
  } = useContractFunctionHook(tokenRegistry, "burn");

  const { restoreToken, state: restoreTokenState } = useRestoreToken(providerOrSigner, tokenRegistry, tokenId);

  const {
    send: surrender,
    state: surrenderState,
    reset: resetSurrender,
  } = useContractFunctionHook(titleEscrow, "surrender");

  const {
    send: changeHolder,
    state: changeHolderState,
    reset: resetChangeHolder,
  } = useContractFunctionHook(titleEscrow, "transferHolder");

  const {
    send: endorseBeneficiary,
    state: endorseBeneficiaryState,
    reset: resetEndorseBeneficiary,
  } = useContractFunctionHook(titleEscrow, "transferBeneficiary");

  const {
    send: nominate,
    state: nominateState,
    reset: resetNominate,
  } = useContractFunctionHook(titleEscrow, "nominate");

  const {
    send: transferOwners,
    state: transferOwnersState,
    reset: resetTransferOwners,
  } = useContractFunctionHook(titleEscrow, "transferOwners");

  const resetProviders = useCallback(() => {
    resetSurrender();
    resetDestroyingTokenState();
    resetChangeHolder();
    resetEndorseBeneficiary();
    resetNominate();
    resetTransferOwners();
  }, [
    resetDestroyingTokenState,
    resetNominate,
    resetChangeHolder,
    resetEndorseBeneficiary,
    resetSurrender,
    resetTransferOwners,
  ]);

  const resetStates = useCallback(() => {
    setTokenId(undefined);
    setTokenRegistryAddress(undefined);
  }, []);

  const initialize = useCallback((address: string, id: string) => {
    setTokenId(id);
    setTokenRegistryAddress(address);
  }, []);

  useEffect(() => {
    if (isTitleEscrow) {
      getHolder();
      getBeneficiary();
      getApprovedBeneficiary();
    }
  }, [getApprovedBeneficiary, getBeneficiary, getHolder, isTitleEscrow]);

  useEffect(() => {
    if (changeHolderState === "CONFIRMED") getHolder();
  }, [changeHolderState, getHolder]);

  useEffect(() => {
    if (nominateState === "CONFIRMED") getApprovedBeneficiary();
  }, [nominateState, getApprovedBeneficiary]);

  useEffect(() => {
    if (endorseBeneficiaryState === "CONFIRMED") updateTitleEscrow();
  }, [endorseBeneficiaryState, updateTitleEscrow]);

  useEffect(() => {
    if (surrenderState === "CONFIRMED") updateTitleEscrow();
  }, [surrenderState, updateTitleEscrow]);

  useEffect(() => {
    if (destroyTokenState === "CONFIRMED") updateTitleEscrow();
  }, [destroyTokenState, updateTitleEscrow]);

  useEffect(() => {
    if (restoreTokenState === "CONFIRMED") updateTitleEscrow();
  }, [restoreTokenState, updateTitleEscrow]);

  useEffect(() => {
    if (transferOwnersState === "CONFIRMED") updateTitleEscrow();
  }, [transferOwnersState, updateTitleEscrow]);

  useEffect(resetProviders, [resetProviders, providerOrSigner]);

  return (
    <TokenInformationContext.Provider
      value={{
        tokenId,
        tokenRegistryAddress,
        initialize,
        holder: holder?.[0],
        beneficiary: beneficiary?.[0],
        approvedBeneficiary: approvedBeneficiary?.[0],
        changeHolder,
        endorseBeneficiary,
        surrender,
        changeHolderState,
        endorseBeneficiaryState,
        surrenderState,
        destroyTokenState,
        destroyToken,
        isSurrendered,
        isTokenBurnt,
        isTitleEscrow,
        documentOwner,
        nominate,
        nominateState,
        transferOwners,
        transferOwnersState,
        resetStates,
        restoreToken,
        restoreTokenState,
      }}
    >
      {children}
    </TokenInformationContext.Provider>
  );
};

export const useTokenInformationContext = (): TokenInformationContext =>
  useContext<TokenInformationContext>(TokenInformationContext);
