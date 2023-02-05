import Koa from 'koa'
import Router  from 'koa-router'
import joi from 'joi'
import validate from 'koa-joi-validate'
import search from './search'
import { client } from './connection'

const app = new Koa()
const router = new Router()

// Log each request to the console
app.use(async (ctx, next) => {
	const start = Date.now()
	await next()
	const ms = Date.now() - start
	console.log(`${ctx.method} ${ctx.url} - ${ms}`)
})

// Log percolated errors to the console
app.on('error', err => {
	console.error('Server Error', err)
})

// Set permissive CORS header
app.use(async (ctx, next) => {
	ctx.set('Access-Control-Allow-Origin', '*')
	return next()
})

// ADD ENDPOINTS HERE

/**
 * GET /search
 * Search for a term in the library
 * Query Params -
 * term: string under 60 characters
 * offset: positive integer
 */
router.get('/search',
	validate({
		query: {
			term: joi.string().max(60).required(),
			offset: joi.number().integer().min(0).default(0)
		}
	}),
	async (ctx, next) => {
		const { term, offset } = ctx.request.query
		ctx.body = await search.queryTerm(term, offset)
	}
)

router.put('/requestlisting',
	validate({
		query: {
			game: joi.object({
				banner: joi.string(),
				capsuleimage: joi.string(),
				contentrating: joi.string(),
				datastoreid: joi.string(),
				description: joi.string(),
				developer: joi.string(),
				discord: joi.string(),
				executables: joi.string(),
				facebook: joi.string(),
				icon: joi.string(),
				instagram: joi.string(),
				longdescription: joi.string(),
				password: joi.string(),
				paymentaddress: joi.string(),
				productid: joi.string(),
				publisher: joi.string(),
				publisherdid: joi.string(),
				screenshots: joi.string(),
				shortdescription: joi.string(),
				status: joi.string(),
				tags: joi.string(),
				title: joi.string(),
				torrents: joi.string(),
				trailer: joi.string(),
				twitter: joi.string(),
				version: joi.string(),
				website: joi.string(),
			}).required()
		}
	}),
	async (ctx, next) => {
		let { game } = ctx.request.query;
		console.log("pre parse", game)
		game = JSON.parse(game)
		game.ispublic = false;

		ctx.body = "Requested listing: " + game;
		console.log("post parse", game);

		await client.index({
			index: 'listings',
			type: 'game',
			id: game.productid + game.publisher,
			body: game,
		});
	}
)

const port = process.env.PORT || 5233

app
	.use(router.routes())
	.use(router.allowedMethods())
	.listen(port, err => {
		if (err) throw err
		console.log(`App Listening on Port ${port}`)
	})
