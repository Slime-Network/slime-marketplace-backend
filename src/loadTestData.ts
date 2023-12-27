import fs from 'fs';
import path from 'path';
import { resetIndex, client } from './app/data/connection';
import { Media } from 'gosti-shared/types/gosti/Media';

const readAndInsertMedias = async () => {
	try {
		await resetIndex();

		const files = fs.readdirSync('./media').filter((file) => file.slice(-5) === '.json');
		console.log(`Found ${files.length} Files`);

		for (const file of files) {
			console.log(`Reading File - ${file}`);
			const filePath = path.join('./media', file);
			const media = parseMediaFile(filePath);
			await insertMediaData(media);
		}
	} catch (err) {
		console.error(err);
	}
};

function parseMediaFile(filePath: string) {
	const media = JSON.parse(fs.readFileSync(filePath, 'utf8'));
	console.log(media);
	if (media.productId) {
		return media as Media;
	}
	return {} as Media;
}

const insertMediaData = async (media: Media) => {
	await client.index({
		index: 'listings',
		id: media.productId,
		document: media,
	});
	console.log(`Indexed Media - ${media.title} By ${media.publisher}`);
};

readAndInsertMedias();
