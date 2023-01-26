
// Core ES variables for this project
const host = 'localhost'
const datalayerPort = 8562
const walletPort = 9256

/** Check the ES connection status */
async function subscribeToDatalayer () {
	axios.get(`http://${host}:${datalayerPort}/`, { params: { game: game } })
		.then(res => {
			console.log(res);
		}
	)
}

module.exports = {
	subscribeToDatalayer
}