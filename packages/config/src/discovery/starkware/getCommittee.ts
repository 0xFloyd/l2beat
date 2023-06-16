import { ProjectPermission } from '../../common'
import { ProjectDiscovery } from '../ProjectDiscovery'

export function getCommittee(discovery: ProjectDiscovery): ProjectPermission {
  const accounts = discovery
    .getConstructorArg<string[]>('Committee', 0)
    .map(discovery.formatPermissionedAccount.bind(discovery))

  const minSigners = discovery.getConstructorArg<string>('Committee', 1)
  return {
    name: 'Data Availability Committee',
    accounts: [],
    additionalAddresses: {
      dropdownTitle: 'Committee Members',
      addresses: accounts.map((account) => account.address),
    },
    description: `Validity proof must be signed by at least ${minSigners} of these addresses to approve state update.`,
  }
}
