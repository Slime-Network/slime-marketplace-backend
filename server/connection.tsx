import elasticsearch from 'elasticsearch'

const index = 'listings'
const type = 'game'
const port = 9200
const host = process.env.ES_HOST || 'localhost'
const client = new elasticsearch.Client({ host: { host, port } })


const checkConnection = async () => {
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

const resetIndex = async () => {
	if (await client.indices.exists({ index })) {
		await client.indices.delete({ index })
	}

	await client.indices.create({ index })
	await putGameMapping(index)
}

const putGameMapping = async (i: string) => {
	const schema = {
		banner: { type: 'text' },
		capsuleimage: { type: 'text' },
		contentrating: { type: 'keyword' },
		datastoreid: { type: 'keyword' },
		description: { type: 'text' },
		developer: { type: 'keyword' },
		discord: { type: 'keyword' },
		executables: { type: 'text' },
		facebook: { type: 'keyword' },
		icon: { type: 'text' },
		instagram: { type: 'keyword' },
		ispublic: { type: 'boolean'},
		longdescription: { type: 'text' },
		password: { type: 'text' },
		paymentaddress: { type: 'keyword' },
		productid: { type: 'keyword' },
		publisher: { type: 'keyword' },
		publisherdid: { type: 'keyword' },
		screenshots: { type: 'keyword' },
		status: { type: 'text' },
		tags: { type: 'text' },
		title: { type: 'text' },
		torrents: { type: 'text' },
		trailer: { type: 'text' },
		twitter: { type: 'keyword' },
		website: { type: 'keyword' },
		version: { type: 'text' },
	}

	return client.indices.putMapping({ index, type, body: { properties: schema } })
}

export { client, checkConnection, resetIndex, index, type }