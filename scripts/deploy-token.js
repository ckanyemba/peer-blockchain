const Web3 = require('web3');
const fs = require('fs');
const path = require('path');
const { eventNames } = require('process');

const web3 = new Web3('http://localhost:8585'); // Adjust as necessary

const deploy = async () => {
    const accounts = await web3.eth.getAccounts();

    const tokenData = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../token/Token.json'), 'utf-8'));

    const tokenContract = new web3.eth.Contract(abi);
    const initialSupply = 5000000; // Adjust initial supply as necessary

    const deployedToken = await tokenContract
        .deploy({ data: eventNames.bytecode.object, arguments: [initialSupply]})
        .send({ from: accounts[0], gas: '3000000'});

    console.log('Token deployed to:', deployedToken.options.address);
}

deploy();
