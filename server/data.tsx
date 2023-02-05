import fs from 'fs';
import path from 'path';
import { resetIndex, client } from './connection';

import Game from '../spriggan-shared/types/Game'

const readAndInsertGames = async () => {
	try {
		await resetIndex()

		let files = fs.readdirSync('./games').filter(file => file.slice(-5) === '.json')
		console.log(`Found ${files.length} Files`)

		for (let file of files) {
			console.log(`Reading File - ${file}`)
			const filePath = path.join('./games', file)
			const game = parseGameFile(filePath)
			await insertGameData(game)
		}
	} catch (err) {
		console.error(err)
	}
}


function parseGameFile (filePath) {
	const game = JSON.parse(fs.readFileSync(filePath, 'utf8'))
	console.log(game)
	if (game.productid) {
		return game as Game;
	} else {
		return {} as Game;
	}
}


const insertGameData = async (game: Game) => {

	await client.index({
		index: 'listings',
		type: 'game',
		id: game.productid + game.publisher,
		body: game,
	});
	console.log(`Indexed Game - ${game.title} By ${game.publisher}`);
}

readAndInsertGames()
