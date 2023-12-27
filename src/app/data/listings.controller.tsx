import { client, checkConnection, index } from './connection';
import { SearchRequest, GetInstallDataRequest, RequestListingOrUpdateRequest, SetMediaPublicRequest, GetSignMessageRequest, SortOptions } from '../../../gosti-shared/types/gosti/MarketplaceApiTypes';

import Koa from 'koa';
import Router from 'koa-router';
import { RPCAgent, ErrorResponse } from 'chia-agent';
import { get_recent_signage_point_or_eos, verify_signature, subscriptions } from 'chia-agent/api/rpc';
import { Media } from '../../gosti-shared/types/gosti/Media';
import { QueryDslQueryContainer, Sort } from '@elastic/elasticsearch/lib/api/types';
import { param } from 'koa-req-validation';

const routerOpts: Router.IRouterOptions = {
	prefix: '/listings',
};

const router: Router = new Router(routerOpts);

router.get('/search', async (ctx: Koa.Context) => {
	const searchParams = ctx.request.query as unknown as SearchRequest;
	console.log('Search params: ', searchParams);
	ctx.body = await queryTerm(searchParams);
});

router.get('/getSignMessage', async (ctx: Koa.Context) => {
	ctx.body = buildSignatureMessage((ctx.request.query as unknown as GetSignMessageRequest).media);
});

const buildSignatureMessage = (media: Media) => {
	const date = new Date();
	const roundedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), 0, 0, 0);

	const message = "gosti signature at: " + roundedDate.toString() + " for media: " + media.productId;
	console.log("message to sign", message)
	return message;
}

router.get('/getInstallData', async (ctx: Koa.Context) => {
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
		console.log("error", e)
		ctx.status = 500;
		ctx.body = e;
	}
});


router.post('/requestListingOrUpdate', async (ctx: Koa.Context) => {
	let params = undefined
	try {
		params = (ctx.request.body as any).params as RequestListingOrUpdateRequest
		console.log("params", params)

		const exists = await client.exists({ index: index, id: params.media.productId });

		// check datalayer

		// const datalayerAgent = new RPCAgent({ service: 'data_layer' });
		// const stores = await subscriptions(datalayerAgent);

		// console.log("stores", stores)


		console.log("exists", exists)
		if (exists) {
			const res = await update(params);
			ctx.body = res;
		} else {
			const res = await requestListing(params);
			ctx.body = res;
		}
	} catch (e) {
		console.log("error", e)
	}
});

router.get('/setMediaPublic', async (ctx: Koa.Context) => {
	const requestParams = ctx.request.query as unknown as SetMediaPublicRequest;
	// need to make this permissioned
	console.log("setMediaPublic", requestParams);
	const res = await setMediaPublic(requestParams);
	ctx.body = res;
});

const queryTerm = (params: SearchRequest) => {
	var sort: Sort = [
		{
			"lastUpdatedContent": {
				"order": "desc"
			}
		},
	]

	switch (params.sort) {
		case SortOptions.DateAsc:
			sort = [
				{
					"lastUpdatedContent": {
						"order": "asc"
					}
				},
			]
			break;
		case SortOptions.DateDesc:
			sort = [
				{
					"lastUpdatedContent": {
						"order": "desc"
					},
				},
			]
			break;
		case SortOptions.NameAsc:
			sort = [
				{
					"title.keyword": {
						"order": "asc"
					}
				},
			]
			break;
		case SortOptions.NameDesc:
			sort = [
				{
					"title.keyword": {
						"order": "desc"
					}
				},
			]
			break;
	}


	var query: QueryDslQueryContainer = {
		bool: {
			must: [
				{
					match: {
						title: {
							query: params.titleTerm,
							operator: 'and',
							fuzziness: 'auto',
						},
					}
				},
				{
					match: {
						isPublic: {
							query: true
						}
					}
				}
			],
		}
	}

	if (params.titleTerm == "" || params.titleTerm == undefined) {
		query = {
			bool: {
				must: [
					{
						match: {
							isPublic: {
								query: true
							}
						}
					}
				],
			}
		}
	}

	return client.search({
		from: params.offset,
		index: index,
		_source: {
			"excludes": ["*.password", "*.torrents", "*.executables"]
		},
		query: query,
		highlight: { fields: { title: {} } },
	});
}
const getInstallData = (params: GetInstallDataRequest) => {
	// need to make this permissioned
	console.log("getInstallData", params)
	return client.search({
		index: index,
		query: {
			bool: {
				must: [
					{
						match: {
							productId: {
								query: params['media[productId]']
							}
						}
					},
					{
						match: {
							isPublic: {
								query: true
							}
						}
					}
				],
			},
		},
		highlight: { fields: { title: {} } },
	});
};

const requestListing = (params: RequestListingOrUpdateRequest) => {
	// need to make setting this permissioned
	return client.index({
		index: 'listings',
		id: params.media.productId,
		document: { ...params.media, isPublic: params.setPublic },
	});
}
const update = (params: RequestListingOrUpdateRequest) => {
	// need to make setting this permissioned
	return client.update({
		index: 'listings',
		id: params.media.productId,
		doc: { ...params.media, isPublic: params.setPublic },
	});
}
const setMediaPublic = (params: SetMediaPublicRequest) => {
	return client.update({
		index: 'listings',
		id: params.media.productId,
		doc: { isPublic: params.isPublic },
	});
}


export { router };


