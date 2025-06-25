import { client, index } from './connection';

import Koa from 'koa';
import Router from 'koa-router';
import { QueryDslQueryContainer, Sort } from '@elastic/elasticsearch/lib/api/types';
import { randomUUID } from 'crypto';
import { Order } from 'slime-shared/types/slime/StorefrontTypes';

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

enum SortOptions {
	DateAsc = 'dateAsc',
	DateDesc = 'dateDesc',
	NameAsc = 'nameAsc',
	NameDesc = 'nameDesc',
}

type SearchRequest = {
	email: string;
	offset: number;
	size: number;
	sort: SortOptions;
};

type PostOrderRequest = {
	order: Order;
};

const routerOpts: Router.IRouterOptions = {
	prefix: '/orders',
};

const ordersRouter: Router = new Router(routerOpts);

// const upsLogin = async () => {
// 	const formData = {
// 		grant_type: 'client_credentials',
// 	};

// 	const resp = await fetch(`https://wwwcie.ups.com/security/v1/oauth/token`, {
// 		method: 'POST',
// 		headers: {
// 			'Content-Type': 'application/x-www-form-urlencoded',
// 			'x-merchant-id': process.env.UPS_MERCHANT_ID,
// 			Authorization: 'Basic ' + Buffer.from(`${process.env.UPS_USERNAME}:${process.env.UPS_PASSWORD}`).toString('base64'),
// 		},
// 		body: new URLSearchParams(formData).toString(),
// 	});

// 	console.log('UPS Login Response Status:', resp.status);

// 	const data = await resp.text();
// 	console.log(data);
// };

// const ups = upsLogin()
// 	.then((data) => {
// 		console.log('UPS Login Successful', data);
// 	})
// 	.catch((error) => {
// 		console.error('UPS Login Failed', error);
// 	});

ordersRouter.get('/search', async (ctx: Koa.Context) => {
	// make permission check here
	const searchParams = ctx.request.query as unknown as SearchRequest;
	ctx.body = await queryTerm(searchParams);
});

ordersRouter.post('/postOrder', async (ctx: Koa.Context) => {
	const postParams = ctx.request.body as unknown as PostOrderRequest;
	ctx.body = await postOrder(postParams);
});

ordersRouter.post('/createPaymentIntent', async (ctx: Koa.Context) => {
	const { cart, amount, currency } = ctx.request.body;

	console.log('Creating PaymentIntent with items:', cart, 'amount:', amount, 'currency:', currency, ctx.request.body);

	// Create a PaymentIntent with the order amount and currency
	const paymentIntent = await stripe.paymentIntents.create({
		amount: amount,
		currency: currency,
		// In the latest version of the API, specifying the `automatic_payment_methods` parameter is optional because Stripe enables its functionality by default.
		automatic_payment_methods: {
			enabled: true,
		},
	});
	ctx.body = {
		clientSecret: paymentIntent.client_secret,
	};
});

ordersRouter.post('/getShippingEstimate', async (ctx: Koa.Context) => {
	const { cart, amount, currency } = ctx.request.body;
	ctx.body = {
		shippingCost: 5.0, // Example static shipping cost
		estimatedDelivery: '3-5 business days', // Example static delivery estimate
	};
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
					orderDate: {
						order: 'asc',
					},
				},
			];
			break;
		case SortOptions.DateDesc:
			sort = [
				{
					orderDate: {
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
						customerEmail: {
							query: params.email,
							operator: 'and',
							fuzziness: 'auto',
						},
					},
				},
			],
		},
	};

	const result = client.search({
		from: params.offset,
		index: index,
		_source: {
			excludes: [],
		},
		query: query,
		highlight: { fields: { names: {} } },
		size: params.size,
	});
	console.log('query Result', query, result);
	return result;
};

const postOrder = (params: PostOrderRequest) => {
	return client.index({
		index: 'orders',
		id: randomUUID(),
		document: { ...params.order },
	});
};

export { ordersRouter };
