const { client, index, listingindex, type } = require('./connection')

module.exports = {
	/** Query ES index for the provided term */
	queryTerm (term, offset = 0) {
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

	queryListingRequests (term, offset = 0) {
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
