import Koa from 'koa';
import cors from '@koa/cors';
import serve from 'koa-static';
import mount from 'koa-mount';
import HttpStatus from 'http-status-codes';

import { listingsRouter } from './data/listings.controller';
import { filesRouter } from './data/files.controller';
import path from 'path';
import koaBody from 'koa-body';

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
	.use(
		koaBody({
			formidable: {
				uploadDir: './public',
				hashAlgorithm: 'sha256',
				keepExtensions: true,
				multiples: false,
				maxFileSize: 100 * 1024 * 1024, // 100MB
			},
			multipart: true,
			urlencoded: true,
		})
	)
	.use(listingsRouter.routes())
	.use(listingsRouter.allowedMethods())
	.use(filesRouter.routes())
	.use(filesRouter.allowedMethods())
	.use(mount('/public', serve('public')))
	.listen(port, (): void => {
		console.log(`App Listening on Port ${port}`);
		console.log(`Path: ${path.join(__dirname, '../../public')}`);
	});
