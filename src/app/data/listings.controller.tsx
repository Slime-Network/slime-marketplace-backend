import { client, index } from './connection';
import {
	SearchRequest,
	GetInstallDataRequest,
	RequestListingOrUpdateRequest,
	SetMediaPublicRequest,
	GetSignMessageRequest,
	SortOptions,
} from '../../slime-shared/types/slime/MarketplaceApiTypes';

import Koa from 'koa';
import Router from 'koa-router';
import { Media } from '../../slime-shared/types/slime/Media';
import { QueryDslQueryContainer, Sort } from '@elastic/elasticsearch/lib/api/types';

const routerOpts: Router.IRouterOptions = {
	prefix: '/listings',
};

const listingsRouter: Router = new Router(routerOpts);

listingsRouter.get('/search', async (ctx: Koa.Context) => {
	const searchParams = ctx.request.query as unknown as SearchRequest;
	ctx.body = await queryTerm(searchParams);
});

listingsRouter.get('/getSignMessage', async (ctx: Koa.Context) => {
	ctx.body = buildSignatureMessage((ctx.request.query as unknown as GetSignMessageRequest).media);
});

const buildSignatureMessage = (media: Media) => {
	const date = new Date();
	const roundedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), 0, 0, 0);

	const message = 'slime signature at: ' + roundedDate.toString() + ' for media: ' + media.productId;
	console.log('message to sign', message);
	return message;
};

listingsRouter.get('/getInstallData', async (ctx: Koa.Context) => {
	const params = ctx.request.query as unknown as GetInstallDataRequest;

	try {
		// const message = buildSignatureMessage(params.media);
		// const walletAgent = new RPCAgent({ service: 'wallet' });
		// const verification = await verify_signature(walletAgent, { message, pubkey: params.pubkey, signature: params.signature })

		// console.log('verification: ', verification);
		const res = await getInstallData(params);
		ctx.status = 200;
		ctx.body = res;
	} catch (e) {
		console.log('error', e);
		ctx.status = 500;
		ctx.body = e;
	}
});

listingsRouter.post('/requestListingOrUpdate', async (ctx: Koa.Context) => {
	let params = undefined;
	try {
		params = (ctx.request.body as any).params as RequestListingOrUpdateRequest;
		console.log('params', params);

		const exists = await client.exists({ index: index, id: params.media.productId });

		// check datalayer

		// const datalayerAgent = new RPCAgent({ service: 'data_layer' });
		// const stores = await subscriptions(datalayerAgent);

		// console.log("stores", stores)

		console.log('exists', exists);
		if (exists) {
			const res = await update(params);
			ctx.body = res;
		} else {
			const res = await requestListing(params);
			ctx.body = res;
		}
	} catch (e) {
		console.log('error', e);
	}
});

listingsRouter.get('/setMediaPublic', async (ctx: Koa.Context) => {
	const requestParams = ctx.request.query as unknown as SetMediaPublicRequest;
	// need to make this permissioned
	console.log('setMediaPublic', requestParams);
	const res = await setMediaPublic(requestParams);
	ctx.body = res;
});

const queryTerm = (params: SearchRequest) => {
	var sort: Sort = [
		{
			lastUpdatedContent: {
				order: 'desc',
			},
		},
	];

	switch (params.sort) {
		case SortOptions.DateAsc:
			sort = [
				{
					lastUpdatedContent: {
						order: 'asc',
					},
				},
			];
			break;
		case SortOptions.DateDesc:
			sort = [
				{
					lastUpdatedContent: {
						order: 'desc',
					},
				},
			];
			break;
		case SortOptions.NameAsc:
			sort = [
				{
					'titles[0].title': {
						order: 'asc',
					},
				},
			];
			break;
		case SortOptions.NameDesc:
			sort = [
				{
					'titles[0].title': {
						order: 'desc',
					},
				},
			];
			break;
	}

	var query: QueryDslQueryContainer = {
		nested: {
			path: 'titles',
			query: {
				bool: {
					must: [
						{
							match: {
								'titles.title': {
									query: params.titleTerm,
									operator: 'and',
									fuzziness: 'auto',
								},
							},
						},
					],
				},
			},
		},
	};

	if (params.titleTerm == '' || params.titleTerm == undefined) {
		query = {
			bool: {
				must: [
					{
						match: {
							isPublic: {
								query: true,
							},
						},
					},
				],
			},
		};
	}

	const result = client.search({
		from: params.offset,
		index: index,
		_source: {
			excludes: ['*.files.password', '*.files.torrent'],
		},
		query: query,
		highlight: { fields: { titles: {} } },
		size: params.size,
	});
	console.log('query Result', query, result);
	return result;
};
const getInstallData = (params: any) => {
	// need to make this permissioned
	console.log('getInstallData', params);
	return client.search({
		index: index,
		query: {
			bool: {
				must: [
					{
						match: {
							productId: {
								query: params['media[productId]'],
							},
						},
					},
					{
						match: {
							isPublic: {
								query: true,
							},
						},
					},
				],
			},
		},
		highlight: { fields: { titles: {} } },
	});
};

const requestListing = (params: RequestListingOrUpdateRequest) => {
	// need to make setting this permissioned
	return client.index({
		index: 'listings',
		id: params.media.productId,
		document: { ...params.media, isPublic: params.setPublic },
	});
};
const update = (params: RequestListingOrUpdateRequest) => {
	// need to make setting this permissioned
	return client.update({
		index: 'listings',
		id: params.media.productId,
		doc: { ...params.media, isPublic: params.setPublic },
	});
};
const setMediaPublic = (params: SetMediaPublicRequest) => {
	return client.update({
		index: 'listings',
		id: params.media.productId,
		doc: { isPublic: params.isPublic },
	});
};

export { listingsRouter };
