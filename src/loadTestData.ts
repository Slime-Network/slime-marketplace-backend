import fs from 'fs';
import path from 'path';
import { resetIndex, client } from './app/data/connection';

import { Media } from '../spriggan-shared/types/Media';

const readAndInsertGames = async () => {
	try {
		await resetIndex();

		const files = fs.readdirSync('./games').filter(file => file.slice(-5) === '.json');
		console.log(`Found ${files.length} Files`);

		for (const file of files) {
			console.log(`Reading File - ${file}`);
			const filePath = path.join('./games', file);
			const game = parseGameFile(filePath);
			await insertGameData(game);
		}
	} catch (err) {
		console.error(err);
	}
};

function parseGameFile(filePath: string) {
	const media = JSON.parse(fs.readFileSync(filePath, 'utf8'));
	console.log(media);
	if (media.productId) {
		return media as Media;
	}
	return {} as Media;
}

const insertGameData = async (media: Media) => {
	await client.index({
		index: 'listings',
		id: media.productId + media.publisher,
		document: media,
	});
	console.log(`Indexed Game - ${media.title} By ${media.publisher}`);
};

readAndInsertGames();
