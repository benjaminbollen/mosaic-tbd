// Load external packages
const chai = require('chai'),
  Web3 = require('web3'),
  OrganizationHelper = require('../../libs/helpers/OrganizationHelper'),
  assert = chai.assert;

const config = require('../../test/utils/configReader'),
  Web3WalletHelper = require('../../test/utils/Web3WalletHelper');

const web3 = new Web3(config.gethRpcEndPoint);
let web3WalletHelper = new Web3WalletHelper(web3);

//Organisation Contract Address. TBD: Do not forget to set caOrganisation = null below.
let caOrganisation = '0x53DaB9024abF6B24219Ee6126525735ee4E6C043';
// let caOrganisation = null;

let validateReceipt = (receipt) => {
  assert.isNotNull(receipt, 'Transaction Receipt is null');
  assert.isObject(receipt, 'Transaction Receipt is not an object');
  assert.isTrue(receipt.status, 'Transaction failed.');
  return receipt;
};

let validateDeploymentReceipt = (receipt) => {
  validateReceipt(receipt);
  let contractAddress = receipt.contractAddress;
  assert.isNotEmpty(contractAddress, 'Deployment Receipt is missing contractAddress');
  assert.isTrue(web3.utils.isAddress(contractAddress), 'Invalid contractAddress in Receipt');
  return receipt;
};
describe('test/chainSetup', function() {
  let deployParams = {
    from: config.deployerAddress,
    gasPrice: config.gasPrice
  };

  const originConfig = {
    deployer: deployParams,
    organization: {
      owner: config.organizationOwner,
      admin: config.organizationAdmin,
      worker: config.organizationWorker
    }
  };

  const auxConfig = {
    deployer: deployParams,
    organization: {
      owner: config.organizationOwner,
      admin: config.organizationAdmin,
      worker: config.organizationWorker
    }
  };

  let helper = new OrganizationHelper(web3, caOrganisation);

  before(function() {
    return web3WalletHelper.init(web3);
  });

  if (!caOrganisation) {
    it('should deploy new organization contract', function() {
      return helper
        .deployOrganization(null, deployParams)
        .then(validateDeploymentReceipt)
        .then((receipt) => {
          caOrganisation = receipt.contractAddress;
        });
    });
  }

  //Admin Key Address
  let kaAdmin = originConfig.organization.admin;
  it('should set admin address', function() {
    return helper.setAdmin(kaAdmin, deployParams).then(validateReceipt);
  });

  //Worker Key Address
  let kaWorker = originConfig.organization.worker;
  it('should set worker address', function() {
    return helper.setWorker(kaWorker, deployParams).then(validateReceipt);
  });

  //Owner Key Address
  let kaOwner = originConfig.organization.owner;
  it('should initiate Ownership Transfer', function() {
    return helper.initiateOwnershipTransfer(kaOwner, deployParams).then(validateReceipt);
  });

  it('should complete Ownership Transfer', function() {
    let ownerParams = Object.assign({}, deployParams, {
      from: kaOwner
    });
    console.log('ownerParams', ownerParams);
    return helper.completeOwnershipTransfer(ownerParams).then(validateReceipt);
  });
});

// Go easy on RPC Client (Geth)
(function() {
  let maxHttpScokets = 10;
  let httpModule = require('http');
  httpModule.globalAgent.keepAlive = true;
  httpModule.globalAgent.keepAliveMsecs = 30 * 60 * 1000;
  httpModule.globalAgent.maxSockets = maxHttpScokets;
})();
