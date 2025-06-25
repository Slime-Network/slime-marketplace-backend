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

	initIndexes();
	// resetIndex();
};

checkConnection();

const initIndexes = async () => {
	if (!(await client.indices.exists({ index }))) {
		await client.indices.create({ index });
		await putMediaMapping(index);
	}

	if (!(await client.indices.exists({ index: 'files' }))) {
		await client.indices.create({ index: 'files' });
		await putFileMapping('files');
	}

	if (!(await client.indices.exists({ index: 'products' }))) {
		console.log('Creating products index');
		await client.indices.create({ index: 'products' });
		await putProductMapping('products');
	}

	if (!(await client.indices.exists({ index: 'orders' }))) {
		await client.indices.create({ index: 'orders' });
		await putOrderMapping('orders');
	}

	if (!(await client.indices.exists({ index: 'people' }))) {
		await client.indices.create({ index: 'people' });
		await putPeopleMapping('people');
	}
};

const resetIndex = async () => {
	console.log('Resetting index...');
	if (await client.indices.exists({ index })) {
		await client.indices.delete({ index });
	}

	if (await client.indices.exists({ index: 'files' })) {
		await client.indices.delete({ index: 'files' });
	}

	if (await client.indices.exists({ index: 'products' })) {
		await client.indices.delete({ index: 'products' });
	}

	if (await client.indices.exists({ index: 'orders' })) {
		await client.indices.delete({ index: 'orders' });
	}

	if (await client.indices.exists({ index: 'people' })) {
		await client.indices.delete({ index: 'people' });
	}

	await client.indices.create({ index });
	await client.indices.create({ index: 'files' });
	await client.indices.create({ index: 'products' });
	await client.indices.create({ index: 'orders' });
	await client.indices.create({ index: 'people' });
	await putMediaMapping(index);
	await putFileMapping('files');
	await putProductMapping('products');
	await putOrderMapping('orders');
	await putPeopleMapping('people');
};

const putMediaMapping = async (i: string) => {
	const schema = {
		datastoreId: { type: 'keyword' },
		isPublic: { type: 'boolean' },
		mediaType: { type: 'text' },
		contentRating: { type: 'nested' },
		descriptions: { type: 'nested' },
		credits: { type: 'nested' },
		childProducts: { type: 'text' },
		lastUpdated: { type: 'long' },
		lastUpdatedContent: { type: 'long' },
		nostrEventId: { type: 'text' },
		images: { type: 'nested' },
		videos: { type: 'nested' },
		donationAddress: { type: 'text' },
		parentProductId: { type: 'text' },
		productId: { type: 'text' },
		publisherDid: { type: 'text' },
		releaseStatus: { type: 'text' },
		supportContact: { type: 'text' },
		tags: { type: 'nested' },
		titles: { type: 'nested' },
		files: { type: 'nested' },
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
	return client.indices.putMapping({ index: i, dynamic: true, properties: schema } as IndicesPutMappingRequest);
};

const putProductMapping = async (i: string) => {
	const schema = {
		productId: { type: 'text' },
		name: { type: 'text' },
		description: { type: 'text' },
		longDescription: { type: 'text' },
		price: { type: 'float' },
		images: { type: 'text' },
		videos: { type: 'text' },
		options: { type: 'text' },
		stock: { type: 'nested' },
		quantity: { type: 'integer' },
		hasPhysical: { type: 'boolean' },
		hasChiaAsset: { type: 'boolean' },
		lastUpdated: { type: 'long' },
		isPublic: { type: 'boolean' },
	};
	console.log('Creating index...');
	return client.indices.putMapping({ index: i, dynamic: true, properties: schema } as IndicesPutMappingRequest);
};

const putOrderMapping = async (i: string) => {
	const schema = {
		orderId: { type: 'text' },
		productId: { type: 'text' },
		quantity: { type: 'integer' },
		price: { type: 'float' },
		customerId: { type: 'text' },
		orderDate: { type: 'date' },
		status: { type: 'text' },
	};
	console.log('Creating index...');
	return client.indices.putMapping({ index: i, dynamic: true, properties: schema } as IndicesPutMappingRequest);
};

const putPeopleMapping = async (i: string) => {
	const schema = {
		personId: { type: 'text' },
		name: { type: 'text' },
		socials: { type: 'nested' },
		description: { type: 'text' },
		longDescription: { type: 'text' },
		did: { type: 'text' },
		images: { type: 'nested' },
		videos: { type: 'nested' },
		lastUpdated: { type: 'long' },
		isPublic: { type: 'boolean' },
	};
	console.log('Creating index...');
	return client.indices.putMapping({ index: i, dynamic: true, properties: schema } as IndicesPutMappingRequest);
};

export { client, checkConnection, resetIndex, index, type };
