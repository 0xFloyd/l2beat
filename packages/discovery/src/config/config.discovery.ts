import { ArbiscanClient, EtherscanClient, getEnv } from '@l2beat/shared'
import { ChainId, minTimestamps, UnixTime } from '@l2beat/shared-pure'
import { config as dotenv } from 'dotenv'

import { CliParameters } from '../cli/getCliParameters'

export function getDiscoveryCliConfig(cli: CliParameters): DiscoveryCliConfig {
  dotenv()
  if (cli.mode !== 'invert' && cli.mode !== 'discover') {
    throw new Error(`No local config for mode: ${cli.mode}`)
  }

  const discoveryEnabled = cli.mode === 'discover'
  const invertEnabled = cli.mode === 'invert'

  return {
    invert: invertEnabled && {
      project: cli.project,
      chainId: cli.chain,
      useMermaidMarkup: cli.useMermaidMarkup,
    },
    discovery: discoveryEnabled && {
      project: cli.project,
      chainId: cli.chain,
      dryRun: cli.dryRun,
      dev: cli.dev,
      blockNumber: getEnv.optionalInteger('DISCOVERY_BLOCK_NUMBER'),
    },
    chains: [
      {
        chainId: ChainId.ETHEREUM,
        rpcUrl: getEnv('DISCOVERY_ETHEREUM_RPC_URL'),
        etherscanApiKey: getEnv('DISCOVERY_ETHEREUM_ETHERSCAN_API_KEY'),
        etherscanUrl: EtherscanClient.API_URL,
        minTimestamp: minTimestamps.ethereum,
      },
      {
        chainId: ChainId.ARBITRUM,
        rpcUrl: getEnv('DISCOVERY_ARBITRUM_RPC_URL'),
        etherscanApiKey: getEnv('DISCOVERY_ARBISCAN_API_KEY'),
        etherscanUrl: ArbiscanClient.API_URL,
        minTimestamp: minTimestamps.arbitrum,
      },
    ],
  }
}

export interface DiscoveryCliConfig {
  discovery: DiscoveryModuleConfig | false
  chains: DiscoveryChainConfig[]
  invert: InversionConfig | false
}

export interface DiscoveryModuleConfig {
  readonly project: string
  readonly chainId: ChainId
  readonly dryRun?: boolean
  readonly dev?: boolean
  readonly blockNumber?: number
}

export interface DiscoveryChainConfig {
  chainId: ChainId
  rpcUrl: string
  etherscanApiKey: string
  etherscanUrl: string
  minTimestamp: UnixTime
}

export interface InversionConfig {
  readonly project: string
  readonly useMermaidMarkup: boolean
  readonly chainId: ChainId
}
