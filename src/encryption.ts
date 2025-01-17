import { fromBase64url, toBase64url } from './utils'
import CID from 'cids'
import { createJWE, decryptJWE, Encrypter, Decrypter } from 'did-jwt'

interface JWERecipient {
  encrypted_key?: string // eslint-disable-line @typescript-eslint/camelcase
  header?: Record<string, any>
}

export interface DagJWE {
  aad?: string
  ciphertext: string
  iv: string
  protected: string
  recipients?: Array<JWERecipient>
  tag: string
  unprotected?: Record<string, any>
}

interface EncodedRecipient {
  encrypted_key?: Uint8Array // eslint-disable-line @typescript-eslint/camelcase
  header?: Record<string, any>
}

export interface EncodedJWE {
  aad?: Uint8Array
  ciphertext: Uint8Array
  iv: Uint8Array
  protected: Uint8Array
  recipients?: Array<EncodedRecipient>
  tag: Uint8Array
  unprotected?: Record<string, any>
}

function fromSplit(split: Array<string>): DagJWE {
  const [protectedHeader, encrypted_key, iv, ciphertext, tag] = split // eslint-disable-line @typescript-eslint/camelcase
  const jwe: DagJWE = {
    ciphertext,
    iv,
    protected: protectedHeader,
    tag,
  }
  if (encrypted_key) jwe.recipients = [{ encrypted_key }] // eslint-disable-line @typescript-eslint/camelcase
  return jwe
}

function encodeRecipient(recipient: JWERecipient): EncodedRecipient {
  const encRec: EncodedRecipient = {}
  if (recipient.encrypted_key) encRec.encrypted_key = fromBase64url(recipient.encrypted_key) // eslint-disable-line @typescript-eslint/camelcase
  if (recipient.header) encRec.header = recipient.header
  return encRec
}

function encode(jwe: DagJWE): EncodedJWE {
  const encJwe: EncodedJWE = {
    ciphertext: fromBase64url(jwe.ciphertext),
    protected: fromBase64url(jwe.protected),
    iv: fromBase64url(jwe.iv),
    tag: fromBase64url(jwe.tag),
  }
  if (jwe.aad) encJwe.aad = fromBase64url(jwe.aad)
  if (jwe.recipients) encJwe.recipients = jwe.recipients.map(encodeRecipient)
  if (jwe.unprotected) encJwe.unprotected = jwe.unprotected
  return encJwe
}

function decodeRecipient(encoded: EncodedRecipient): JWERecipient {
  const recipient: JWERecipient = {}
  if (encoded.encrypted_key) recipient.encrypted_key = toBase64url(encoded.encrypted_key) // eslint-disable-line @typescript-eslint/camelcase
  if (encoded.header) recipient.header = encoded.header
  return recipient
}

function decode(encoded: EncodedJWE): DagJWE {
  const jwe: DagJWE = {
    ciphertext: toBase64url(encoded.ciphertext),
    protected: toBase64url(encoded.protected),
    iv: toBase64url(encoded.iv),
    tag: toBase64url(encoded.tag),
  }
  if (encoded.aad) jwe.aad = toBase64url(encoded.aad)
  if (encoded.recipients) jwe.recipients = encoded.recipients.map(decodeRecipient)
  if (encoded.unprotected) jwe.unprotected = encoded.unprotected
  return jwe
}

export async function createDagJWE(
  cid: CID,
  encrypters: Array<Encrypter>,
  header?: Record<string, any>,
  aad?: Uint8Array
): Promise<DagJWE> {
  if (!CID.isCID(cid)) throw new Error('A CID has to be used as a payload')
  return createJWE(cid.bytes, encrypters, header, aad)
}

export async function decryptDagJWE(jwe: DagJWE, decrypter: Decrypter): Promise<CID> {
  const cidBytes = await decryptJWE(jwe as any, decrypter)
  return new CID(cidBytes)
}

export default {
  fromSplit,
  decode,
  encode,
}
