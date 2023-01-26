const fs = require('fs');
const path = require('path');
const esConnection = require('./connection');

class Game {
	constructor(
			productid, datastoreid, title, publisher, capsuleimage,
			developer, description, longdescription, website, twitter,
			discord, instagram, publisherdid, contentrating, icon,
			tags, status, version, screenshots, paymentaddress, password, ispublic) {

		this.productid = productid;
		this.datastoreid = datastoreid;
		this.title = title;
		this.publisher = publisher;
		this.capsuleimage = capsuleimage;
		this.developer = developer;
		this.description = description;
		this.longdescription = longdescription;
		this.website = website;
		this.twitter = twitter;
		this.discord = discord;
		this.instagram = instagram;
		this.publisherdid = publisherdid;
		this.contentrating = contentrating;
		this.icon = icon;
		this.tags = tags;
		this.status = status;
		this.version = version;
		this.screenshots = screenshots;
		this.paymentaddress = paymentaddress;
		this.password = password;
		this.ispublic = true;
	}
}

async function readAndInsertGames () {
	try {
		await esConnection.resetIndex()

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
		return new Game(
			game.productid,
			game.datastoreid,
			game.title,
			game.publisher,
			game.capsuleimage,
			game.developer,
			game.description,
			game.longdescription,
			game.website,
			game.twitter,
			game.discord,
			game.instagram,
			game.publisherdid,
			game.contentrating,
			game.icon,
			game.tags,
			game.status,
			game.version,
			game.screenshots,
			game.paymentaddress,
			game.password,
			game.ispublic
		);
	} else {
		return new Game();
	}
}


async function insertGameData (game) {

	await esConnection.client.index({
		index: 'listings',
		type: 'game',
		id: game.productid + game.publisher,
		body: game,
	});
	console.log(`Indexed Game - ${game.title} By ${game.publisher}`);
}

readAndInsertGames()
