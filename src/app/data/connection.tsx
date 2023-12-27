import { Client, NodeOptions } from '@elastic/elasticsearch';
import { IndicesPutMappingRequest } from '@elastic/elasticsearch/lib/api/types';

const index = 'listings';
const type = 'media';
const port = 9200;
const host = process.env.ES_HOST || 'localhost';

console.log("Connected to Elasticsearch: " + "http://" + host + ':' + port)
const client = new Client({
	node: {
		url: new URL("http://" + host + ':' + port),
		id: 'es-client',
	} as NodeOptions,
});

const checkConnection = async () => {
	let isConnected = false;
	while (!isConnected) {
		console.log('Connecting to ES');
		try {
			const health = await client.cluster.health({});
			console.log(health);
			isConnected = true;
		} catch (err: any) {
			console.log('Connection Failed, Retrying...', err);
		}
		await new Promise(resolve => setTimeout(resolve, 1000 * 10));
	}
	if (!await client.indices.exists({ index })) {
		putMediaMapping(index);
	}
};

checkConnection();

const resetIndex = async () => {
	if (await client.indices.exists({ index })) {
		await client.indices.delete({ index });
	}

	await client.indices.create({ index });
	await putMediaMapping(index);
};

const putMediaMapping = async (i: string) => {

	const schema = {
		banner: { type: 'text' },
		businessEmail: { type: 'text' },
		capsuleImage: { type: 'text' },
		contentRating: { type: 'keyword' },
		datastoreId: { type: 'keyword' },
		description: { type: 'text' },
		creator: { type: 'keyword' },
		discord: { type: 'keyword' },
		executables: { type: 'text' },
		facebook: { type: 'keyword' },
		icon: { type: 'text' },
		instagram: { type: 'keyword' },
		isPublic: { type: 'boolean' },
		lastUpdated: { type: 'number' },
		lastUpdatedContent: { type: 'number' },
		longDescription: { type: 'text' },
		password: { type: 'text' },
		paymentAddress: { type: 'keyword' },
		productId: { type: 'keyword' },
		publisher: { type: 'keyword' },
		publisherDid: { type: 'keyword' },
		screenshots: { type: 'keyword' },
		status: { type: 'text' },
		supportEmail: { type: 'text' },
		tags: { type: 'text' },
		title: { type: 'text' },
		torrents: { type: 'text' },
		trailer: { type: 'text' },
		twitter: { type: 'keyword' },
		website: { type: 'keyword' },
		version: { type: 'text' },
	};
	console.log('Creating index...');
	return client.indices.putMapping({ index, dynamic: true, properties: schema } as IndicesPutMappingRequest);
};

export { client, checkConnection, resetIndex, index, type };
