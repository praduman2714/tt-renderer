import React, { FunctionComponent, ReactNode } from "react";
import { ErrorBoundary, FallbackComponentType } from "../ErrorBoundary";
import { getCurrentProvider, useProviderContext } from "../common/contexts/provider";
import { ErrorPage, ErrorPageProps } from "@tradetrust-tt/tradetrust-ui-components";
import Link from "next/link";
import { UnsupportedNetworkError } from "../common/errors";

export enum CERTIFICATE_VIEWER_ERROR_TYPE {
  GENERIC,
  UNSUPPORTED_NETWORK,
  CONTRACT_REVERT,
  RPC_CALL_EXCEPTION,
}

export const CERTIFICATE_VIEWER_ERROR_MESSAGES = {
  [CERTIFICATE_VIEWER_ERROR_TYPE.GENERIC]: {
    title: "Generic error",
    heading: "Something Went Wrong",
    description: "TradeTrust has encountered an issue.",
  },
  [CERTIFICATE_VIEWER_ERROR_TYPE.UNSUPPORTED_NETWORK]: {
    title: "Unsupported network",
    heading: "Whoops!",
    description: "Try changing to a correct network for the document.",
  },
  [CERTIFICATE_VIEWER_ERROR_TYPE.CONTRACT_REVERT]: {
    title: "Contract revert",
    heading: "Whoops!",
    description:
      "There might be an issue with the network or contract. Make sure you are on the correct network for the document.",
  },
  [CERTIFICATE_VIEWER_ERROR_TYPE.RPC_CALL_EXCEPTION]: {
    title: "RPC call exception",
    heading: "Whoops!",
    description: "There might be an issue with the network.",
  },
};

const getErrorType = (error?: Error): CERTIFICATE_VIEWER_ERROR_TYPE => {
  const provider = getCurrentProvider();
  const errorMessage = error?.message;

  if (!errorMessage) {
    return CERTIFICATE_VIEWER_ERROR_TYPE.GENERIC;
  }

  switch (true) {
    case !provider || error instanceof UnsupportedNetworkError:
      return CERTIFICATE_VIEWER_ERROR_TYPE.UNSUPPORTED_NETWORK;
    case errorMessage.includes("call revert exception"):
      return CERTIFICATE_VIEWER_ERROR_TYPE.CONTRACT_REVERT;
    case errorMessage.includes("SERVER_ERROR"):
      return CERTIFICATE_VIEWER_ERROR_TYPE.RPC_CALL_EXCEPTION;
    default:
      return CERTIFICATE_VIEWER_ERROR_TYPE.GENERIC;
  }
};

export const getRetryLink = ({
  errorType,
  recover,
}: {
  errorType: CERTIFICATE_VIEWER_ERROR_TYPE;
  recover: () => void;
}): React.ReactNode => {
  const linkHome = (
    <h3 className="font-normal my-2 sm:my-4 text-lg sm:text-2xl">
      Go to{" "}
      <Link href="/" className="text-cerulean-300 underline">
        Homepage
      </Link>
      ?
    </h3>
  );

  const linkRecover = (
    <h3 className="font-normal my-2 sm:my-4 text-lg sm:text-xl">
      <button onClick={recover} className="text-cerulean-300 underline">
        OK, let's try again!
      </button>
    </h3>
  );

  switch (errorType) {
    case CERTIFICATE_VIEWER_ERROR_TYPE.UNSUPPORTED_NETWORK:
    case CERTIFICATE_VIEWER_ERROR_TYPE.CONTRACT_REVERT:
    case CERTIFICATE_VIEWER_ERROR_TYPE.RPC_CALL_EXCEPTION:
      return linkRecover;
    default:
      return linkHome;
  }
};

export const getErrorPageProps = ({
  errorType,
}: {
  errorType: CERTIFICATE_VIEWER_ERROR_TYPE;
}): ErrorPageProps => {
  const message = CERTIFICATE_VIEWER_ERROR_MESSAGES[errorType] ?? CERTIFICATE_VIEWER_ERROR_MESSAGES[CERTIFICATE_VIEWER_ERROR_TYPE.GENERIC]
  ;
  return {
    pageTitle: message.title,
    header: message.heading,
    description: message.description,
    image: "/static/images/errorpage/error-boundary.png",
  };
};

const ErrorComponent: FallbackComponentType = (props) => {
  const { error, recover } = props;
  const errorType = getErrorType(error);
  const errorPageProps = getErrorPageProps({ errorType });
  const retryLink = getRetryLink({ errorType, recover });

  return <ErrorPage {...errorPageProps}>{retryLink}</ErrorPage>;
};

interface CertificateViewerErrorBoundaryProps {
  children: ReactNode;
}

export const CertificateViewerErrorBoundary: FunctionComponent<CertificateViewerErrorBoundaryProps> = ({ children }) => {
  const { reloadNetwork } = useProviderContext();

  const recoverHandler = async () => {
    await reloadNetwork();
  };

  return (
    <ErrorBoundary FallbackComponent={ErrorComponent} onRecover={recoverHandler}>
      {children}
    </ErrorBoundary>
  );
};
