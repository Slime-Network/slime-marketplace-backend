import axios from 'axios'
import { Media } from '../spriggan-shared/types/Media'

const host = 'localhost'
const datalayerPort = 8562
const walletPort = 9256

const subscribeToDatalayer = async () => {
	await axios.get(`http://${host}:${datalayerPort}/`, { params: { game: {} } })
		.then(res => {
			console.log(res);
		}
	)
}

export default subscribeToDatalayer;