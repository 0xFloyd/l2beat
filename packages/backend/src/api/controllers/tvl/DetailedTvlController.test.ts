import { tokenList } from '@l2beat/config'
import { Logger } from '@l2beat/shared'
import {
  AssetId,
  ChainId,
  EthereumAddress,
  ProjectId,
  UnixTime,
  ValueType,
} from '@l2beat/shared-pure'
import { expect, mockObject } from 'earl'

import { ReportProject } from '../../../core/reports/ReportProject'
import { AggregatedReportRepository } from '../../../peripherals/database/AggregatedReportRepository'
import { AggregatedReportStatusRepository } from '../../../peripherals/database/AggregatedReportStatusRepository'
import { ReportRepository } from '../../../peripherals/database/ReportRepository'
import { ReportStatusRepository } from '../../../peripherals/database/ReportStatusRepository'
import { getProjectAssetChartData } from './charts'
import { DetailedTvlController } from './DetailedTvlController'

const START = UnixTime.fromDate(new Date('2022-05-31'))
const MINIMUM_TIMESTAMP = START.add(-1, 'hours')
const USDC = tokenList.find((x) => x.symbol === 'USDC')!

const ARBITRUM: ReportProject = {
  projectId: ProjectId('arbitrum'),
  type: 'layer2',
  escrows: [
    {
      address: EthereumAddress.random(),
      sinceTimestamp: new UnixTime(0),
      tokens: [USDC],
    },
  ],
}

describe(DetailedTvlController.name, () => {
  describe(
    DetailedTvlController.prototype.getDetailedTvlApiResponse.name,
    () => {
      it('selects minimum viable timestamp for the aggregation', async () => {
        const baseReport = {
          timestamp: MINIMUM_TIMESTAMP,
          usdValue: 1234_56n,
          ethValue: 1_111111n,
          amount: 111_1111n * 10n ** (6n - 4n),
          asset: AssetId.USDC,
          chainId: ChainId.ETHEREUM,
          projectId: ARBITRUM.projectId,
          type: ValueType.CBV,
        }

        const baseAggregatedReport = [
          {
            timestamp: MINIMUM_TIMESTAMP,
            usdValue: 1234_56n,
            ethValue: 1_111111n,
            valueType: ValueType.CBV,
            projectId: ARBITRUM.projectId,
          },
          {
            timestamp: MINIMUM_TIMESTAMP,
            usdValue: 1234_56n,
            ethValue: 1_111111n,
            valueType: ValueType.CBV,
            projectId: ProjectId.ALL,
          },
          {
            timestamp: MINIMUM_TIMESTAMP,
            usdValue: 1234_56n,
            ethValue: 1_111111n,
            valueType: ValueType.CBV,
            projectId: ProjectId.BRIDGES,
          },
          {
            timestamp: MINIMUM_TIMESTAMP,
            usdValue: 1234_56n,
            ethValue: 1_111111n,
            valueType: ValueType.CBV,
            projectId: ProjectId.LAYER2S,
          },
        ]

        const reportStatusRepository = mockObject<ReportStatusRepository>({
          findLatestTimestampOfType: async (type) =>
            type === ValueType.CBV
              ? START
              : type === ValueType.EBV
              ? START.add(-15, 'minutes')
              : type === ValueType.NMV
              ? START.add(-30, 'minutes')
              : undefined,
        })
        const aggregatedReportStatusRepository =
          mockObject<AggregatedReportStatusRepository>({
            findLatestTimestamp: async () => MINIMUM_TIMESTAMP,
          })

        const reportRepository = mockObject<ReportRepository>({
          getByTimestamp: async () => [baseReport],
        })

        const aggregatedReportRepository =
          mockObject<AggregatedReportRepository>({
            getDailyWithAnyType: async () => baseAggregatedReport,
            getHourlyWithAnyType: async () => baseAggregatedReport,
            getSixHourlyWithAnyType: async () => baseAggregatedReport,
          })
        const controller = new DetailedTvlController(
          reportStatusRepository,
          aggregatedReportRepository,
          reportRepository,
          aggregatedReportStatusRepository,
          [ARBITRUM],
          [USDC],
          Logger.SILENT,
        )

        await controller.getDetailedTvlApiResponse()

        expect(reportRepository.getByTimestamp).toHaveBeenCalledWith(
          MINIMUM_TIMESTAMP,
        )

        expect(
          aggregatedReportRepository.getDailyWithAnyType,
        ).toHaveBeenCalledTimes(1)

        expect(
          aggregatedReportRepository.getHourlyWithAnyType,
        ).toHaveBeenCalledWith(MINIMUM_TIMESTAMP.add(-7, 'days'))

        expect(
          aggregatedReportRepository.getSixHourlyWithAnyType,
        ).toHaveBeenCalledWith(MINIMUM_TIMESTAMP.add(-90, 'days'))
      })
    },
  )

  /**
   * TODO: Add test for granular/exact matches of produces chart points
   */
  describe(
    DetailedTvlController.prototype.getDetailedAssetTvlApiResponse.name,
    () => {
      it('produces detailed asset`s balances in time for charts', async () => {
        const projectId = ProjectId('arbitrum')
        const chainId = ChainId.ARBITRUM
        const asset = AssetId.USDC
        const type = ValueType.CBV

        const fakeReports = fakeReportSeries(projectId, chainId, asset, type)

        const reportStatusRepository = mockObject<ReportStatusRepository>({
          findLatestTimestamp: async () => fakeReports.to,
        })

        const reportRepository = mockObject<ReportRepository>({
          getHourlyForDetailed: async () => fakeReports.hourlyReports,
          getSixHourlyForDetailed: async () => fakeReports.sixHourlyReports,
          getDailyForDetailed: async () => fakeReports.dailyReports,
        })

        const controller = new DetailedTvlController(
          reportStatusRepository,
          mockObject<AggregatedReportRepository>(),
          reportRepository,
          mockObject<AggregatedReportStatusRepository>(),
          [ARBITRUM],
          [USDC],
          Logger.SILENT,
        )

        const result = await controller.getDetailedAssetTvlApiResponse(
          projectId,
          chainId,
          asset,
          type,
        )

        expect(result?.daily).toEqual({
          types: ['timestamp', USDC.symbol.toLowerCase(), 'usd'],
          data: getProjectAssetChartData(
            fakeReports.dailyReports,
            USDC.decimals,
            24,
          ),
        })

        expect(result?.sixHourly).toEqual({
          types: ['timestamp', USDC.symbol.toLowerCase(), 'usd'],
          data: getProjectAssetChartData(
            fakeReports.sixHourlyReports,
            USDC.decimals,
            6,
          ),
        })

        expect(result?.hourly).toEqual({
          types: ['timestamp', USDC.symbol.toLowerCase(), 'usd'],
          data: getProjectAssetChartData(
            fakeReports.hourlyReports,
            USDC.decimals,
            1,
          ),
        })

        expect(reportStatusRepository.findLatestTimestamp).toHaveBeenCalledWith(
          chainId,
          type,
        )

        expect(reportRepository.getHourlyForDetailed).toHaveBeenCalledWith(
          projectId,
          chainId,
          asset,
          type,
          fakeReports.to.add(-7, 'days'),
        )

        expect(reportRepository.getSixHourlyForDetailed).toHaveBeenCalledWith(
          projectId,
          chainId,
          asset,
          type,
          fakeReports.to.add(-90, 'days'),
        )

        expect(reportRepository.getDailyForDetailed).toHaveBeenCalledWith(
          projectId,
          chainId,
          asset,
          type,
        )
      })
    },
  )
})

function fakeAssetReport(
  projectId: ProjectId,
  chainId: ChainId,
  asset: AssetId,
  type: ValueType,
  timestamp: UnixTime,
) {
  return {
    timestamp: timestamp,
    usdValue: 10_000_000n,
    ethValue: 10_000n,
    amount: 50_000_000n * 10n ** (6n - 4n),
    asset,
    chainId,
    projectId,
    type,
  }
}

function fakeReportSeries(
  projectId: ProjectId,
  chainId: ChainId,
  asset: AssetId,
  type: ValueType,
) {
  const to = UnixTime.now()
  const from = to.add(-90, 'days')

  const timeDiff = to.toNumber() - from.toNumber()

  const hoursInDiff = Math.floor(timeDiff / 1000 / 60 / 60)
  const sixHoursInDiff = Math.floor(hoursInDiff / 6)
  const daysInDiff = Math.floor(hoursInDiff / 24)

  const hourlyTimestamps = Array.from({ length: hoursInDiff }, (_, i) =>
    from.add(i, 'hours'),
  )

  const sixHourlyTimestamps = Array.from({ length: sixHoursInDiff }, (_, i) =>
    from.add(i * 6, 'hours'),
  )

  const dailyTimestamps = Array.from({ length: daysInDiff }, (_, i) =>
    from.add(i, 'days'),
  )

  const hourlyReports = hourlyTimestamps.map((timestamp) =>
    fakeAssetReport(projectId, chainId, asset, type, timestamp),
  )

  const sixHourlyReports = sixHourlyTimestamps.map((timestamp) =>
    fakeAssetReport(projectId, chainId, asset, type, timestamp),
  )

  const dailyReports = dailyTimestamps.map((timestamp) =>
    fakeAssetReport(projectId, chainId, asset, type, timestamp),
  )

  return {
    from,
    to,
    hourlyReports,
    sixHourlyReports,
    dailyReports,
  }
}
