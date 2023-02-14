import { client, index, type } from './connection';
import { SearchParams } from '../../../spriggan-shared/types/SearchTypes';

import Koa from 'koa';
import Router from 'koa-router';

const routerOpts: Router.IRouterOptions = {
	prefix: '/games',
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
		ctx.body = await search.mostRecent(searchParams);
	},
);

const search = {
	queryTerm: (params: SearchParams) => {
		return client.search({
			from: params.offset,
			index: index,
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
							ispublic: {
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
							ispublic: {
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
