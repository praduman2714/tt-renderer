"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useImperativeHandle,
  FunctionComponent,
  Ref,
} from "react";
import { connect } from "react-redux";
import { applyPrivacyFilter } from "../reducers/certificate";
import { TemplateProps } from "@/types";
import {
  WrappedOrSignedOpenAttestationDocument,
  getOpenAttestationData,
  getTemplateUrl,
} from "../../utils/shared";

const DEFAULT_RENDERER_URL = `https://generic-templates.tradetrust.io`;
const SCROLLBAR_WIDTH = 20;

interface DecentralisedRendererProps {
  rawDocument: WrappedOrSignedOpenAttestationDocument;
  updateTemplates: (templates: TemplateProps[]) => void;
  selectedTemplate: string;
  setPrivacyFilter: (doc: any) => void;
  forwardedRef: Ref<{ print: () => void } | null>;
}

const DecentralisedRenderer: FunctionComponent<DecentralisedRendererProps> = ({
  rawDocument,
  updateTemplates,
  selectedTemplate,
  setPrivacyFilter,
  forwardedRef,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const documentData = useMemo(() => getOpenAttestationData(rawDocument), [rawDocument]);
  const [height, setHeight] = useState(250);
  const source = getTemplateUrl(rawDocument) ?? DEFAULT_RENDERER_URL;

  useImperativeHandle(forwardedRef, () => ({
    print() {
      iframeRef.current?.contentWindow?.postMessage({ type: "PRINT" }, "*");
    },
  }));

  const postRenderDocument = useCallback(() => {
    iframeRef.current?.contentWindow?.postMessage(
      {
        type: "RENDER_DOCUMENT",
        payload: {
          rawDocument,
          document: documentData,
        },
      },
      "*"
    );
  }, [rawDocument, documentData]);

  const postSelectTemplate = useCallback(() => {
    iframeRef.current?.contentWindow?.postMessage(
      {
        type: "SELECT_TEMPLATE",
        payload: selectedTemplate,
      },
      "*"
    );
  }, [selectedTemplate]);

  // Listen for messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const { type, payload } = event.data || {};
      if (!type) return;

      switch (type) {
        case "UPDATE_HEIGHT":
          setHeight(payload + SCROLLBAR_WIDTH);
          break;
        case "UPDATE_TEMPLATES":
          updateTemplates(payload);
          break;
        case "OBFUSCATE":
          setPrivacyFilter(payload);
          break;
        default:
          break;
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [updateTemplates, setPrivacyFilter]);

  useEffect(() => {
    postRenderDocument();
  }, [postRenderDocument]);

  useEffect(() => {
    if (selectedTemplate) postSelectTemplate();
  }, [postSelectTemplate]);

  return (
    <div className="container">
      <iframe
        ref={iframeRef}
        src={source}
        style={{ height: `${height}px`, width: "100%", border: "none" }}
      />
    </div>
  );
};

const mapDispatchToProps = (dispatch: any) => ({
  setPrivacyFilter: (doc: any) => dispatch(applyPrivacyFilter(doc)),
});

const ForwardedRenderer = React.forwardRef<
  { print: () => void } | null,
  {
    rawDocument: WrappedOrSignedOpenAttestationDocument;
    updateTemplates: (templates: TemplateProps[]) => void;
    selectedTemplate: string;
    setPrivacyFilter: (doc: any) => void;
  }
>((props, ref) => <DecentralisedRenderer {...props} forwardedRef={ref} />);

ForwardedRenderer.displayName = "ForwardedRenderer";

export const DecentralisedRendererContainer = connect(
  null,
  mapDispatchToProps,
  null,
  { forwardRef: true }
)(ForwardedRenderer);
