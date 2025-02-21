import { State } from '../../state/State'
import { calculateActivityView } from './calculateActivityView'
import { calculateDetailedTvlView } from './calculateDetailedTvlView'
import { calculateRegularTvlView } from './calculateRegularTvlView'
import { calculateTokenTvlView } from './calculateTokenTvlView'

export function calculateView(
  data: State['data'],
  controls: State['controls'],
): State['view'] | undefined {
  if (controls.view === 'tvl') {
    if (controls.token) {
      return calculateTokenTvlView(data, controls)
    } else {
      return calculateRegularTvlView(data, controls)
    }
  } else if (controls.view === 'detailedTvl') {
    return calculateDetailedTvlView(data, controls)
  } else {
    return calculateActivityView(data, controls)
  }
}
