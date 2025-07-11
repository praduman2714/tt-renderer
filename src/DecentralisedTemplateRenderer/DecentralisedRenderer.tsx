"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useImperativeHandle,
  FunctionComponent,
  Ref,
  useState,
} from "react";
import {
  FrameActions,
  FrameConnector,
  renderDocument,
  selectTemplate,
  print,
} from "@tradetrust-tt/decentralized-renderer-react-components";
import { applyPrivacyFilter } from "../reducers/certificate";
import { connect } from "react-redux";
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
  const toFrame = useRef<((action: FrameActions) => void) | null>(null);
  const document = useMemo(() => getOpenAttestationData(rawDocument), [rawDocument]);
  const [height, setHeight] = useState(250);
  const source = getTemplateUrl(rawDocument) ?? DEFAULT_RENDERER_URL;

  useImperativeHandle(forwardedRef, () => ({
    print() {
      if (toFrame.current) {
        toFrame.current(print());
      }
    },
  }));

  const onConnected = useCallback((frame: (action: FrameActions) => void) => {
    toFrame.current = frame;
    frame(renderDocument({ document, rawDocument }));
  }, [document, rawDocument]);

  const dispatch = useCallback((action: FrameActions) => {
    switch (action.type) {
      case "UPDATE_HEIGHT":
        setHeight(action.payload + SCROLLBAR_WIDTH);
        break;
      case "UPDATE_TEMPLATES":
        updateTemplates(action.payload);
        break;
      case "OBFUSCATE":
        setPrivacyFilter(action.payload);
        break;
    }
  }, [updateTemplates, setPrivacyFilter]);

  useEffect(() => {
    if (toFrame.current) {
      toFrame.current(renderDocument({ document, rawDocument }));
    }
  }, [document, rawDocument]);

  useEffect(() => {
    if (toFrame.current && selectedTemplate) {
      toFrame.current(selectTemplate(selectedTemplate));
    }
  }, [selectedTemplate]);

  return (
    <div className="container">
      <FrameConnector
        source={source}
        style={{ height: `${height}px`, width: "100%", border: "none" }}
        dispatch={dispatch}
        onConnected={onConnected}
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
