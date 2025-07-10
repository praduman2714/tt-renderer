"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { utils } from "@tradetrust-tt/tradetrust";
import { TemplateProps } from "@/types";
import React from "react";
import { FORM_SG_URL } from "@/route";
import { Banner } from "@/Banner";
import { DocumentUtility } from "@/DocumentUtility";
import { DecentralisedRendererContainer } from "@/DecentralisedTemplateRenderer/DecentralisedRenderer";
import { CertificateViewerErrorBoundary } from "@/CertificateViewerErrorBoundary/CertificateViewerErrorBoundary";
import { WrappedOrSignedOpenAttestationDocument } from "../../utils/shared";

const renderBanner = (isSample: boolean, isMagic: boolean | undefined) => {
  const props = {
    to: FORM_SG_URL,
    buttonText: "Contact us now",
    title: "Ready to learn how TradeTrust can benefit your business?",
    absolute: true,
  };
  if (isSample || isMagic) {
    return <Banner className="mt-8" {...props} />;
  } else {
    return null;
  }
};

export default function Home() {
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [document, setDocument] = useState();
  const [templates, setTemplates] = useState<TemplateProps[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [showEndorsementChain, setShowEndorsementChain] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".tt")) {
      alert("Please select a .tt file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        setFileContent(JSON.stringify(json, null, 2));
        setDocument(json);
      } catch (error) {
        alert("Invalid JSON format in .tt file");
        setFileContent(null);
      }
    };
    reader.readAsText(file);
  };

  useEffect(() => {
    if (fileContent) {
      const isTransferableAsset = utils.isTransferableAsset(document);
      console.log({ isTransferableAsset });
    }
  }, [fileContent])

  const childRef = React.useRef<{ print: () => void }>(null);

  const updateTemplates = useCallback((templateList: TemplateProps[]) => {
    // filter all templates that are renderable currently
    const templatesModified = templateList.filter((item) => {
      return item.type === "custom-template" || item.type === "application/pdf" || !item.type; // !item.type caters to renderers that still has decentralized-renderer-react-components dependency at <2.3.0, where type does not exists
    });

    // set modified templates
    setTemplates(templatesModified);
    setSelectedTemplate(templatesModified[0].id);
  }, []);

  const onPrint = () => {
    if (childRef.current) {
      childRef.current.print();
    }
  };

  // const isSampleDocument = useSelector((state: RootState) => state.sample.isSampleDocument);
  // const certificateDoc = useSelector((state: RootState) => state.certificate.rawModified);

  const renderedCertificateViewer = (
    <>
      <div className="no-print">
        {/* {!isTransferableDocument && (
          <div className="container flex justify-between">
            <div className="w-2/3">
              <DocumentStatus isMagicDemo={isMagicDemo} />
            </div>
          </div>
        )} */}
        {/* {renderBanner(isSampleDocument, isMagicDemo)} */}
        {/* <ObfuscatedMessage document={document} />
        {isTransferableDocument && (
          <AssetManagementApplication
            isMagicDemo={isMagicDemo}
            tokenId={tokenId}
            tokenRegistryAddress={tokenRegistryAddress}
            setShowEndorsementChain={setShowEndorsementChain}
          />
        )} */}
      </div>

      <div className="no-print mt-16">
        {/* <MultiTabs
          hasAttachments={hasAttachments}
          attachments={attachments}
          templates={templates}
          setSelectedTemplate={setSelectedTemplate}
          selectedTemplate={selectedTemplate}
        /> */}
      </div>
      <div className="bg-white py-6">
        {/* {attachments && (
          <div className={`${selectedTemplate !== "attachmentTab" ? "hidden" : "block"}`}>
            <TabPaneAttachments attachments={attachments} />
          </div>
        )} */}
        <div className={`${selectedTemplate === "attachmentTab" ? "hidden" : "block"}`}>
          {templates.length > 0 && <DocumentUtility document={document as unknown as WrappedOrSignedOpenAttestationDocument} onPrint={onPrint} />}
          <DecentralisedRendererContainer
            rawDocument={document}
            updateTemplates={updateTemplates}
            selectedTemplate={selectedTemplate}
            ref={childRef}
          />
        </div>
      </div>
    </>
  );
  console.log("renderedCertificate Viewer ", renderedCertificateViewer);

  return (
    <div className="grid grid-rows-[auto_1fr_auto] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-6 row-start-2 items-center sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
        <label className="inline-block px-4 py-2 bg-blue-600 text-white rounded cursor-pointer hover:bg-blue-700">
          Select .tt File
          <input
            type="file"
            accept=".tt"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>

        {/* Display File Content */}
        {/* {fileContent && (
          <pre className="bg-gray-100 p-4 rounded max-w-full overflow-auto text-sm whitespace-pre-wrap">
            {fileContent}
          </pre>
        )} */}

        {document && (
          <CertificateViewerErrorBoundary>
            {renderedCertificateViewer}
          </CertificateViewerErrorBoundary>
        )}
      </main>

      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center text-sm">
        <a
          className="flex items-center gap-2 hover:underline"
          href="https://nextjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image src="/globe.svg" alt="Globe icon" width={16} height={16} />
          Next.js
        </a>
        <a
          className="flex items-center gap-2 hover:underline"
          href="https://vercel.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image src="/vercel.svg" alt="Vercel icon" width={16} height={16} />
          Vercel
        </a>
      </footer>
    </div>
  );
}

