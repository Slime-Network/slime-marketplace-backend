import { client } from './connection';

import Koa from 'koa';
import Router from 'koa-router';
import { QueryDslQueryContainer, Sort } from '@elastic/elasticsearch/lib/api/types';
import { randomUUID } from 'crypto';
import { Product } from 'slime-shared/types/slime/StorefrontTypes';

const adminKeys = process.env.ADMIN_KEYS?.split(',') || [];

enum SortOptions {
	DateAsc = 'dateAsc',
	DateDesc = 'dateDesc',
	NameAsc = 'nameAsc',
	NameDesc = 'nameDesc',
}

type SearchRequest = {
	productName: string;
	offset: number;
	size: number;
	sort: SortOptions;
	adminKey?: string;
	includePrivate?: string;
	creatorId?: string;
};

type CreateProductRequest = {};

type UpdateProductRequest = {
	product: Product;
};

const routerOpts: Router.IRouterOptions = {
	prefix: '/products',
};

const productsRouter: Router = new Router(routerOpts);

productsRouter.get('/search', async (ctx: Koa.Context) => {
	const searchParams = ctx.request.query as unknown as SearchRequest;
	if (
		(searchParams.includePrivate || searchParams.adminKey) &&
		searchParams.adminKey &&
		!adminKeys.includes(searchParams.adminKey)
	) {
		ctx.status = 403;
		ctx.body = { error: 'Forbidden' };
		return;
	}
	ctx.body = await queryName(searchParams);
});

productsRouter.post('/createProduct', async (ctx: Koa.Context) => {
	const key = ctx.request.body['key'];
	if (!adminKeys.includes(key)) {
		ctx.status = 403;
		ctx.body = { error: 'Forbidden' };
		return;
	}
	const postParams = ctx.request.body as unknown as CreateProductRequest;
	ctx.body = await createProduct(postParams);
});

productsRouter.post('/updateProduct', async (ctx: Koa.Context) => {
	const key = ctx.request.body['key'];
	console.log('Update Product', ctx.request.body);

	if (!adminKeys.includes(key)) {
		ctx.status = 403;
		ctx.body = { error: 'Forbidden' };
		return;
	}
	const updateParams = ctx.request.body as unknown as UpdateProductRequest;
	ctx.body = await updateProduct(updateParams);
	return;
});

const queryName = async (params: SearchRequest) => {
	var sort: Sort = [
		{
			lastUpdated: {
				order: 'desc',
			},
		},
	];

	switch (params.sort) {
		case SortOptions.DateAsc:
			sort = [
				{
					lastUpdated: {
						order: 'asc',
					},
				},
			];
			break;
		case SortOptions.DateDesc:
			sort = [
				{
					lastUpdated: {
						order: 'desc',
					},
				},
			];
			break;
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
		multi_match: {
			query: params.productName || params.creatorId || '',
			type: 'best_fields',
			fields: ['name', 'creator'],
			tie_breaker: 0.3,
		},
	};

	if (!params.creatorId && !params.productName) {
		if (params.includePrivate === 'true') {
			query = {
				match_all: {},
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

	console.log('Query:', JSON.stringify(query));
	const result = await client.search({
		from: params.offset,
		index: 'products',
		_source: {
			excludes: [],
		},
		query: query as QueryDslQueryContainer,
		size: params.size,
	});
	if (!params.includePrivate) {
		result.hits.hits = result.hits.hits.filter((hit) => (hit._source as Product).isPublic !== false);
	}
	console.log('query Result', JSON.stringify(result));
	return result;
};

const createProduct = (params: CreateProductRequest) => {
	const id = randomUUID();
	return client.index({
		index: 'products',
		id: id,
		document: {
			productId: id,
			name: '',
			description: '',
			longDescription: '',
			price: 0,
			options: [],
			images: [],
			videos: [],
			quantity: 0,
			hasPhysical: false,
			hasChiaAsset: false,
			lastUpdated: Date.now(),
			isPublic: true,
		},
	});
};

const updateProduct = (params: UpdateProductRequest) => {
	console.log('Update Product Params', params);
	return client.update({
		index: 'products',
		id: params.product.productId,
		doc: params.product,
	});
};

export { productsRouter };
