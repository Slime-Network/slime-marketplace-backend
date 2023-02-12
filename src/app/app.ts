import Koa from 'koa';
import HttpStatus from 'http-status-codes';

import { router } from './data/search.controller';

const app = new Koa();
const port = process.env.PORT || 5233

// Set permissive CORS header
app.use(async (ctx, next) => {
	ctx.set('Access-Control-Allow-Origin', '*')
	return next()
})

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


app.use(router.routes())
	.use(router.allowedMethods())
	.listen(port, (): void => {
		console.log(`App Listening on Port ${port}`)
	})
