import { client, index, type } from './connection'

const search = {
	queryTerm: (term: string, offset: number = 0) => {
		const body = {
			from: offset,
			query: {
				bool: {
					must: [
						{match: {
							title: {
								query: term,
								operator: 'and',
								fuzziness: 'auto'
							}
						}},
						{match: {
							ispublic: {
								query: true
							}
						}}
					]
				}
			},
			highlight: { fields: { title: {} } }
		}
		return client.search({ index, type, body })
	},

	queryListingRequests: (term: string, offset: number = 0) => {
		const body = {
			from: offset,
			query: {
				bool: {
					must: [
						{match: {
							title: {
								query: term,
								operator: 'and',
								fuzziness: 'auto'
							}
						}},
						{match: {
							ispublic: {
								query: false
							}
						}}
					]
				}
			},
			highlight: { fields: { title: {} } }
		}
		return client.search({ index, type, body })
	}
}

export default search