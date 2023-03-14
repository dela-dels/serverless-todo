import { CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'

import { verify } from 'jsonwebtoken'
import { createLogger } from '../../utils/logger'
import Axios from 'axios'
import { JwtPayload } from '../../auth/JwtPayload'

const logger = createLogger('auth')

// To get this URL you need to go to an Auth0 page -> Show Advanced Settings -> Endpoints -> JSON Web Key Set
const jwksUrl =
  'https://dev-vgfer0miwt7v0zxv.eu.auth0.com/.well-known/jwks.json'

let cachedCertificate: string

export const handler = async (event: any): Promise<CustomAuthorizerResult> => {
  logger.info('Authorizing user with token:', event.authorizationToken)
  try {
    const jwtToken = await verifyAuthorizationToken(event.authorizationToken)
    logger.info('User was authorized', jwtToken)

    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (e) {
    logger.error('User not authorized', { error: e.message })

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}

async function verifyAuthorizationToken(
  authHeader: string
): Promise<JwtPayload> {
  const token = retrieveAuthorizationToken(authHeader)
  const cert = await getCertificate()
  // You can read more about how to do this here: https://auth0.com/blog/navigating-rs256-and-jwks/
  logger.info(`Verifying OAuth token`)
  return verify(token, cert, { algorithms: ['RS256'] }) as JwtPayload
}

function retrieveAuthorizationToken(authorizationHeader: string): string {
  if (!authorizationHeader)
    throw new Error('No authorization header passed or null')

  if (!authorizationHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

  const split = authorizationHeader.split(' ')

  const token = split[1]

  return token
}

function certificateToPEM(certificate: string): string {
  certificate = certificate.match(/.{1,64}/g).join('\n')
  certificate = `-----BEGIN CERTIFICATE-----\n${certificate}\n-----END CERTIFICATE-----\n`
  return certificate
}

async function getCertificate(): Promise<string> {
  if (cachedCertificate) return cachedCertificate

  logger.info(`Fetching certificate from ${jwksUrl}`)

  const response = await Axios.get(jwksUrl)
  const keys = response.data.keys

  if (!keys || !keys.length) throw new Error('No JWKS keys found')

  const signingKeys = keys
    .filter(
      (key) =>
        key.use === 'sig' && // JWK property `use` determines the JWK is for signature verification
        key.kty === 'RSA' && // We are only supporting RSA (RS256)
        key.kid && // The `kid` must be present to be useful for later
        ((key.x5c && key.x5c.length) || (key.n && key.e)) // Has useful public keys
    )
    .map((key) => {
      return {
        kid: key.kid,
        nbf: key.nbf,
        publicKey: certificateToPEM(key.x5c[0])
      }
    })
  if (!signingKeys.length) throw new Error('No JWKS signing keys found')

  const key = signingKeys[0]

  cachedCertificate = key.publicKey

  logger.info('certificate valid', cachedCertificate)

  return cachedCertificate
}
