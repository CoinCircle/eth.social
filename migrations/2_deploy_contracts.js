var Meetup = artifacts.require("./Meetup.sol");

module.exports = function(deployer) {
  deployer.deploy(Meetup);
};
