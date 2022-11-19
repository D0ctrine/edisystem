const ftp = require('basic-ftp')

async function hi(){
	const client = new ftp.Client()
    client.ftp.verbose = true
    try {
        await client.access({
            host: '211.180.182.7',
            user: 'WI',
            password: 'WI120423',
            secure: false
        })
        console.log('await client.list()')
        console.log(await client.list())
        // await client.downloadTo(FILE_NAME, ftpInfo.BASE_DIR + '/' + FILE_NAME)
    }
    catch(err) {
        console.log(err)
    }
    client.close()
}
hi();