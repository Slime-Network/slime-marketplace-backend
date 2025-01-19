import { client } from './connection';
import Router from 'koa-router';
import Koa from 'koa';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { GetFileRequest, UploadResponse } from 'slime-shared/types/slime/MarketplaceApiTypes';

const routerOpts: Router.IRouterOptions = {
	prefix: '/files',
};

const filesRouter: Router = new Router(routerOpts);

filesRouter.post('/uploadText', async (ctx: Koa.Context) => {
	const req = (ctx.request.body as any).params as any;

	const fileHash = crypto.createHash('sha256').update(req.text).digest('hex');
	const resp = await client.index({
		index: 'files',
		id: fileHash,
		document: { file: req.text, hash: fileHash },
	});
	const f = fs.openSync(path.join(__dirname, '..', '..', '..', 'public', `${fileHash}.json`), 'w');

	fs.writeSync(f, req.text);
	fs.closeSync(f);
	ctx.body = { id: fileHash, message: 'Upload Successful' } as UploadResponse;
});

filesRouter.post('/uploadFile', async (ctx: Koa.Context) => {
	const files = ctx.request.files;
	if (files === undefined) {
		ctx.body = { message: 'No file found' };
		return;
	}
	const file = files.file;

	let fileHash: string | undefined | null = '';
	if (Array.isArray(file)) {
		console.log('uploading files: ', file[0]);
		file[0].hashAlgorithm = 'sha256';
		// fileHash = file[0].hash;
		fileHash = file[0].newFilename;
	} else {
		console.log('uploading file: ', file);
		console.log('uploading file: ', file.toJSON());
		file.hashAlgorithm = 'sha256';
		// fileHash = file.hash;
		fileHash = file.newFilename;
	}

	const resp = await client.index({
		index: 'files',
		id: fileHash ?? '',
		document: { file: file, hash: fileHash },
	});
	console.log('resp: ', resp);
	ctx.body = { id: fileHash, message: 'Upload Successful' } as UploadResponse;
});

filesRouter.get('/get', async (ctx: Koa.Context) => {
	const params = ctx.request.query as unknown as GetFileRequest;
	const file = await client.get({ index: 'files', id: params.id });
	ctx.body = (file._source as any).file;
});

export { filesRouter };
