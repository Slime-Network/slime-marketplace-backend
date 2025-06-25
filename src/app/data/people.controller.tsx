import { client } from './connection';

import Koa from 'koa';
import Router from 'koa-router';
import { QueryDslQueryContainer, Sort } from '@elastic/elasticsearch/lib/api/types';
import { randomUUID } from 'crypto';
import { Person } from 'slime-shared/types/slime/StorefrontTypes';

const adminKeys = process.env.ADMIN_KEYS?.split(',') || [];

enum SortOptions {
	NameAsc = 'nameAsc',
	NameDesc = 'nameDesc',
}

type SearchRequest = {
	name: string;
	offset: number;
	size: number;
	sort: SortOptions;
	includePrivate?: string;
	adminKey?: string;
};

type CreatePersonRequest = {};

type UpdatePersonRequest = {
	person: Person;
};

const routerOpts: Router.IRouterOptions = {
	prefix: '/people',
};

const peopleRouter: Router = new Router(routerOpts);

peopleRouter.get('/search', async (ctx: Koa.Context) => {
	const searchParams = ctx.request.query as unknown as SearchRequest;
	if (searchParams.includePrivate && searchParams.adminKey && !adminKeys.includes(searchParams.adminKey)) {
		ctx.status = 403;
		ctx.body = { error: 'Forbidden' };
		return;
	}
	ctx.body = await queryName(searchParams);
});

peopleRouter.post('/createPerson', async (ctx: Koa.Context) => {
	const key = ctx.request.body['key'];
	console.log('Create Person', ctx.request.body);
	if (!adminKeys.includes(key)) {
		ctx.status = 403;
		ctx.body = { error: 'Forbidden' };
		return;
	}
	const postParams = ctx.request.body as unknown as CreatePersonRequest;
	ctx.body = await createPerson(postParams);
});

peopleRouter.post('/updatePerson', async (ctx: Koa.Context) => {
	const key = ctx.request.body['key'];
	console.log('Update Person', ctx.request.body);
	console.log('Config Admins', adminKeys);
	if (!adminKeys.includes(key)) {
		ctx.status = 403;
		ctx.body = { error: 'Forbidden' };
		return;
	}
	const updateParams = ctx.request.body as unknown as UpdatePersonRequest;
	ctx.body = await updatePerson(updateParams);
	return;
});

const queryName = (params: SearchRequest) => {
	var sort: Sort = [
		{
			lastUpdated: {
				order: 'desc',
			},
		},
	];

	switch (params.sort) {
		case SortOptions.NameAsc:
			sort = [
				{
					name: {
						order: 'asc',
					},
				},
			];
			break;
		case SortOptions.NameDesc:
			sort = [
				{
					name: {
						order: 'desc',
					},
				},
			];
			break;
	}

	var query: QueryDslQueryContainer = {
		bool: {
			must: [
				{
					match: {
						name: {
							query: params.name,
							operator: 'and',
							fuzziness: 'auto',
						},
						isPublic: {
							query: true,
						},
					},
				},
			],
		},
	};

	if (params.includePrivate == 'true') {
		query = {
			bool: {
				must: [
					{
						match: {
							name: {
								query: params.name,
								operator: 'and',
								fuzziness: 'auto',
							},
						},
					},
				],
			},
		};
	}

	if (params.name == '' || params.name == undefined) {
		if (params.includePrivate == 'true') {
			query = {
				match_all: {
					boost: 1.0,
				},
			};
		} else {
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
	}

	const result = client.search({
		from: params.offset,
		index: 'people',
		_source: {
			excludes: [],
		},
		query: query,
		highlight: { fields: { titles: {} } },
		size: params.size,
	});
	console.log('query Result', query, result);
	return result;
};

const createPerson = (params: CreatePersonRequest) => {
	const id = randomUUID();
	return client.index({
		index: 'people',
		id: id,
		document: {
			personId: id,
			name: '',
			socials: [],
			description: '',
			images: [],
			videos: [],
			lastUpdated: Date.now(),
			isPublic: true,
		},
	});
};

const updatePerson = (params: UpdatePersonRequest) => {
	console.log('Update Person Params', params);
	return client.update({
		index: 'people',
		id: params.person.personId,
		doc: params.person,
	});
};

export { peopleRouter };
