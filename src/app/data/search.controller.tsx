import { client, index, type } from './connection';
import { SearchParams, InstallDataParams } from '../../../spriggan-shared/types/SearchTypes';

import Koa from 'koa';
import Router from 'koa-router';

const routerOpts: Router.IRouterOptions = {
	prefix: '/media',
};

const router: Router = new Router(routerOpts);

router.get('/search', async (ctx: Koa.Context) => {
		const searchParams = ctx.request.query as unknown as SearchParams;
		console.log('Search params: ', searchParams);
		ctx.body = await search.queryTerm(searchParams);
	},
);

router.get('/mostRecent', async (ctx: Koa.Context) => {
		const searchParams = ctx.request.query as unknown as SearchParams;
		console.log('Search params: ', searchParams);
		const res = await search.mostRecent(searchParams);
		console.log(res)
		ctx.body = res;
	},
);

router.get('/getInstallData', async (ctx: Koa.Context) => {
		const searchParams = ctx.request.query as unknown as InstallDataParams;
		console.log('Search params: ', searchParams);
		const res = await search.installData(searchParams);
		ctx.body = res;
	},
);

const search = {
	queryTerm: (params: SearchParams) => {
		return client.search({
			from: params.offset,
			index: index,
			_source: {
				"excludes": [ "*.password", "*.torrents", "*.executables" ]
			},
			query: {
				bool: {
					must: [
						{match: {
							title: {
								query: params.titleTerm,
								operator: 'and',
								fuzziness: 'auto',
							},
						}},
						{match: {
							isPublic: {
								query: true
							}
						}}
					],
				},
			},
			highlight: { fields: { title: {} } },
		});
	},
	mostRecent: (params: SearchParams) => {
		return client.search({
			from: params.offset,
			index: index,
			query: {
				bool: {
					must: [
						{match_all: { } },
						{match: {
							isPublic: {
								query: true
							}
						}}
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
						{match: {
							productId: {
								query: params.productId
							}
						}},
						{match: {
							isPublic: {
								query: true
							}
						}}
					],
				},
			},
			highlight: { fields: { title: {} } },
		});
	},
};


export { router };
