import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
const cors = require('@koa/cors');
import HttpStatus from 'http-status-codes';

import { router } from './data/listings.controller';

const app = new Koa();
const port = process.env.PORT || 5233;

// Set permissive CORS header
app.use(async (ctx, next) => {
	ctx.set('Access-Control-Allow-Origin', '*');
	ctx.set('Access-Control-Allow-Credentials', 'true');
	ctx.set('Max-Http-Header-Size', '1000000000');
	return next();
});
app.use(cors());

// Generic error handling middleware.
app.use(async (ctx: Koa.Context, next: () => Promise<any>) => {
	try {
		await next();
	} catch (error: any) {
		ctx.status = error.statusCode || error.status || HttpStatus.INTERNAL_SERVER_ERROR;
		error.status = ctx.status;
		ctx.body = { error };
		ctx.app.emit('error', error, ctx);
	}
});

// Application error logging.
app.on('error', console.error);

app
	.use(bodyParser())
	.use(router.routes())
	.use(router.allowedMethods())
	.listen(port, (): void => {
		console.log(`App Listening on Port ${port}`);
	});
