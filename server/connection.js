const elasticsearch = require('elasticsearch')

// Core ES variables for this project
const index = 'listings'
const type = 'game'
const port = 9200
const host = process.env.ES_HOST || 'localhost'
const client = new elasticsearch.Client({ host: { host, port } })

/** Check the ES connection status */
async function checkConnection () {
	let isConnected = false
	while (!isConnected) {
		console.log('Connecting to ES')
		try {
			const health = await client.cluster.health({})
			console.log(health)
			isConnected = true
		} catch (err) {
			console.log('Connection Failed, Retrying...', err)
		}
	}
}

/** Clear the index, recreate it, and add mappings */
async function resetIndex () {
	if (await client.indices.exists({ index })) {
		await client.indices.delete({ index })
	}

	await client.indices.create({ index })
	await putGameMapping(index)
}

/** Add game section schema mapping to ES */
async function putGameMapping (i) {
	const schema = {
		productid: { type: 'keyword' },
		datastoreid: { type: 'keyword' },
		title: { type: 'text' },
		description: { type: 'text' },
		longdescription: { type: 'text' },
		developer: { type: 'keyword' },
		publisher: { type: 'keyword' },
		website: { type: 'keyword' },
		twitter: { type: 'keyword' },
		discord: { type: 'keyword' },
		instagram: { type: 'keyword' },
		facebook: { type: 'keyword' },
		publisherdid: { type: 'keyword' },
		contentrating: { type: 'keyword' },
		capsuleimage: { type: 'text' },
		icon: { type: 'text' },
		banner: { type: 'text' },
		trailer: { type: 'text' },
		tags: { type: 'text' },
		status: { type: 'text' },
		version: { type: 'text' },
		screenshots: { type: 'keyword' },
		torrents: { type: 'text' },
		executables: { type: 'text' },
		paymentaddress: { type: 'keyword' },
		password: { type: 'text' },
		ispublic: { type: 'boolean'}
	}

	return client.indices.putMapping({ index, type, body: { properties: schema } })
}

module.exports = {
	client, index, type, checkConnection, resetIndex
}
