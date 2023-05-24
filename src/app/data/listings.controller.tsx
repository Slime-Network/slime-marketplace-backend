import { client, index, type } from './connection';
import { SearchParams, InstallDataParams, RequestListingOrUpdateParams, SetMediaPublicParams } from '../../../spriggan-shared/types/SearchTypes';

import { RPCAgent } from "chia-agent";
import { verify_signature } from "chia-agent/api/rpc/wallet";
import { validationResults } from "koa-req-validation";
import Koa from 'koa';
import Router from 'koa-router';
import { ParsedUrlQuery } from 'querystring';
import { Media } from '../../../spriggan-shared/types/Media';

const routerOpts: Router.IRouterOptions = {
	prefix: '/listings',
};

const router: Router = new Router(routerOpts);

router.get('/search', async (ctx: Koa.Context) => {
	const searchParams = ctx.request.query as unknown as SearchParams;
	console.log('Search params: ', searchParams);
	ctx.body = await search.queryTerm(searchParams);
});

router.get('/mostRecent', async (ctx: Koa.Context) => {
	const searchParams = ctx.request.query as unknown as SearchParams;
	console.log('Search params: ', searchParams);
	const res = await search.mostRecent(searchParams);
	console.log(res)
	ctx.body = res;
});

router.get('/getSignMessage', async (ctx: Koa.Context) => {
	// const agent = new RPCAgent({ service: "full_node" });
	// const signagePoint = await get_recent_signage_point_or_eos(agent);
	const date = new Date();
	const roundedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), 0, 0, 0);
	const message = "Spriggan signature at: " + roundedDate.toString();
	console.log("message to sign", message)
	ctx.body = message;
});

router.get('/getInstallData', async (ctx: Koa.Context) => {
	const params = ctx.request.query as unknown as InstallDataParams;

	// const walletAgent = new RPCAgent({ service: "wallet" });
	// const signagePoint = await get_recent_signage_point_or_eos(fullNodeAgent);


	const date = new Date();
	const roundedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), 0, 0, 0);

	console.log("roundedDate", roundedDate)

	// const verification = await verify_signature(walletAgent, { message: roundedDate.toString(), pubkey: params.pubkey, signature: params.signature })

	// check offer in params to confirm ownership

	console.log('verification: ', params);
	const res = await search.installData(params);
	ctx.body = res;
});


router.post('/requestListingOrUpdate', async (ctx: Koa.Context) => {
	let params = undefined
	try {
		params = (ctx.request.body as any).params as RequestListingOrUpdateParams
		console.log("params", params)

		const exists = await client.exists({ index: index, id: params.media.productId });

		// check datalayer

		console.log("exists", exists)
		if (exists) {
			const res = await listing.update(params);
			ctx.body = res;
		} else {
			const res = await listing.requestListing(params);
			ctx.body = res;
		}
	} catch (e) {
		console.log("error", e)
	}
});

router.get('/setMediaPublic', async (ctx: Koa.Context) => {
	const requestParams = ctx.request.query as unknown as SetMediaPublicParams;
	console.log("setMediaPublic", requestParams);
	const res = await listing.setMediaPublic(requestParams);
	ctx.body = res;
});

const search = {
	queryTerm: (params: SearchParams) => {
		return client.search({
			from: params.offset,
			index: index,
			_source: {
				"excludes": ["*.password", "*.torrents", "*.executables"]
			},
			query: {
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
				},
			},
			highlight: { fields: { title: {} } },
		});
	},
	mostRecent: (params: SearchParams) => {
		return client.search({
			from: params.offset,
			index: index, _source: {
				"excludes": ["*.password", "*.torrents", "*.executables"]
			},
			query: {
				bool: {
					must: [
						{ match_all: {} },
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
	},
	installData: (params: InstallDataParams) => {
		return client.search({
			index: index,
			query: {
				bool: {
					must: [
						{
							match: {
								productId: {
									query: params.productId
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
	},
};

const listing = {
	requestListing: (params: RequestListingOrUpdateParams) => {
		return client.index({
			index: 'listings',
			id: params.media.productId,
			document: { ...params.media, isPublic: true },
		});
	},
	update: (params: RequestListingOrUpdateParams) => {
		return client.update({
			index: 'listings',
			id: params.media.productId,
			doc: params.media,
		});
	},
	setMediaPublic: (params: SetMediaPublicParams) => {
		return client.update({
			index: 'listings',
			id: params.productId,
			doc: { isPublic: params.isPublic },
		});
	},
};


export { router };


