import { Client, NodeOptions } from '@elastic/elasticsearch';
import { IndicesPutMappingRequest } from '@elastic/elasticsearch/lib/api/types';

const index = 'listings';
const type = 'media';
const port = 9200;
const host = process.env.ES_HOST || 'localhost';

console.log('Connected to Elasticsearch: ' + 'http://' + host + ':' + port);
const client = new Client({
	node: {
		url: new URL('http://' + host + ':' + port),
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
		await new Promise((resolve) => setTimeout(resolve, 1000 * 10));
	}
	if (!(await client.indices.exists({ index }))) {
		await client.indices.delete({ index });
		putMediaMapping(index);
	}
	if (!(await client.indices.exists({ index: 'files' }))) {
		console.log('Creating files index');
		await client.indices.create({ index: 'files' });
		putFileMapping('files');
	}
	// resetIndex();
};

checkConnection();

const resetIndex = async () => {
	console.log('Resetting index...');
	if (await client.indices.exists({ index })) {
		await client.indices.delete({ index });
	}

	if (await client.indices.exists({ index: 'files' })) {
		await client.indices.delete({ index: 'files' });
	}

	await client.indices.create({ index });
	await client.indices.create({ index: 'files' });
	await putMediaMapping(index);
	await putFileMapping('files');
};

const putMediaMapping = async (i: string) => {
	const schema = {
		datastoreId: { type: 'keyword' },
		isPublic: { type: 'boolean' },
		mediaType: { type: 'text' },
		contentRating: { type: 'object' },
		descriptions: { type: 'object' },
		credits: { type: 'object' },
		childProducts: { type: 'text' },
		executables: { type: 'object' },
		lastUpdated: { type: 'long' },
		lastUpdatedContent: { type: 'long' },
		nostrEventId: { type: 'text' },
		password: { type: 'text' },
		images: { type: 'object' },
		videos: { type: 'object' },
		donationAddress: { type: 'text' },
		parentProductId: { type: 'text' },
		productId: { type: 'text' },
		publisherDid: { type: 'text' },
		releaseStatus: { type: 'text' },
		supportContact: { type: 'text' },
		tags: { type: 'object' },
		titles: { type: 'object' },
		torrents: { type: 'object' },
		version: { type: 'text' },
	};
	console.log('Creating index...');
	return client.indices.putMapping({ index, dynamic: true, properties: schema } as IndicesPutMappingRequest);
};

const putFileMapping = async (i: string) => {
	const schema = {
		hash: { type: 'text' },
		files: { type: 'binary' },
	};
	console.log('Creating index...');
	return client.indices.putMapping({ index: i, dynamic: false, properties: schema } as IndicesPutMappingRequest);
};

export { client, checkConnection, resetIndex, index, type };
