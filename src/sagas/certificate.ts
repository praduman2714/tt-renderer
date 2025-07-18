import { put, select, takeEvery } from "redux-saga/effects";
import { getLogger } from "../../utils/logger";
import {
  types,
  verifyingCertificateCompleted,
  verifyingCertificateFailure,
  getCertificate,
  detectingTRV5Certificate,
} from "../reducers/certificate";
import { processQrCode } from "../services/qrProcessor";
import { verifyDocument } from "../services/verify";
import { isValid } from "@tradetrust-tt/tt-verify";
import { decryptString } from "@govtechsg/oa-encryption";
import { getHistory } from "../history";
import { CONSTANTS } from "@tradetrust-tt/tradetrust-utils";
import { ActionPayload } from "./../types";
import { utils } from "@tradetrust-tt/tradetrust";
import { getTokenRegistryAddress, isTokenRegistryV5 } from "../../utils/shared";

const { trace } = getLogger("saga:certificate");

const { TYPES } = CONSTANTS;

export function* verifyCertificate(): any {
  try {
    yield put({
      type: types.VERIFYING_CERTIFICATE,
    });

    const certificate = yield select(getCertificate);
    const isTransferableAsset = utils.isTransferableAsset(certificate);
    if (isTransferableAsset) {
      const registryAddress = getTokenRegistryAddress(certificate);
      const tokenId = `0x${utils.getAssetId(certificate)}`;
      if (registryAddress && tokenId) {
        const tokenRegistryV5 = yield isTokenRegistryV5(registryAddress, tokenId);
        if (tokenRegistryV5) {
          yield put(detectingTRV5Certificate(TYPES.INVALID));
          return;
        }
      }
    }

    const verificationStatus = yield verifyDocument(certificate);
    trace(`Verification Status: ${JSON.stringify(verificationStatus)}`);

    // Instead of success/failure, report completeness
    yield put(verifyingCertificateCompleted(verificationStatus));
    if (isValid(verificationStatus)) {
      const history = getHistory();
      if (history) {
        history.push("/viewer");
      }

    }
  } catch (e) {
    yield put(verifyingCertificateFailure(TYPES.CLIENT_NETWORK_ERROR));
  }
}

export function* handleQrScanned({ payload: qrCode }: { type: string; payload: any }): any {
  try {
    const { payload, anchor } = yield processQrCode(qrCode);

    yield put({
      type: types.RETRIEVE_CERTIFICATE_BY_ACTION,
      payload,
      anchor,
    });
  } catch (e) {
    yield put(verifyingCertificateFailure(TYPES.CLIENT_NETWORK_ERROR));
  }
}

interface RetrieveCertificateByAction {
  type: string;
  payload: ActionPayload;
  anchor: { key: string };
}

export function* retrieveCertificateByAction({ payload, anchor }: RetrieveCertificateByAction): any {
  try {
    yield put({
      type: types.RETRIEVE_CERTIFICATE_BY_ACTION_PENDING,
    });

    const { uri, key: payloadKey } = payload;
    const { key: anchorKey } = anchor;
    const key = anchorKey || payloadKey; // https://github.com/TradeTrust/tradetrust-website/pull/397

    // if a key has been provided, let's assume
    let certificate = yield window.fetch(uri).then((response) => {
      if (response.status >= 400 && response.status < 600) {
        throw new Error(`Unable to load the certificate from ${uri}`);
      }
      return response.json();
    });
    certificate = certificate.document || certificate; // opencerts-function returns the document in a nested document object

    if (!certificate) {
      throw new Error(`Certificate at address ${uri} is empty`);
    }

    // will only decrypt if type is `OPEN-ATTESTATION-TYPE-1`, so far only oa-encryption uses this
    if (certificate.type === "OPEN-ATTESTATION-TYPE-1") {
      if (key) {
        const decryptedCertificate = decryptString({
          tag: certificate.tag,
          cipherText: certificate.cipherText,
          iv: certificate.iv,
          key,
          type: certificate.type,
        });
        certificate = JSON.parse(decryptedCertificate);
      } else {
        throw new Error(`Unable to decrypt certificate with key=${key} and type=${certificate.type}`);
      }
    }

    yield put({
      type: types.UPDATE_CERTIFICATE,
      payload: certificate,
    });
    yield put({
      type: types.RETRIEVE_CERTIFICATE_BY_ACTION_SUCCESS,
    });
  } catch (e) {
    if (e instanceof Error) {
      yield put({
        type: types.RETRIEVE_CERTIFICATE_BY_ACTION_FAILURE,
        payload: e.message,
      });
    }
  }
}

export default [
  takeEvery(types.CERTIFICATE_PROCESS_QR_CODE, handleQrScanned),
  takeEvery(types.UPDATE_CERTIFICATE, verifyCertificate),
  takeEvery(types.RETRIEVE_CERTIFICATE_BY_ACTION, retrieveCertificateByAction),
];
