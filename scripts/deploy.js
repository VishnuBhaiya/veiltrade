const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with", deployer.address);

  const USDC = await ethers.getContractFactory("MockUSDC");
  const usdc = await USDC.deploy(deployer.address);
  await usdc.waitForDeployment();

  const RWA = await ethers.getContractFactory("MockRWA");
  const rwa = await RWA.deploy(deployer.address);
  await rwa.waitForDeployment();

  const Registry = await ethers.getContractFactory("EligibilityRegistry");
  const registry = await Registry.deploy(deployer.address);
  await registry.waitForDeployment();

  const Settlement = await ethers.getContractFactory("VeilSettlement");
  const settlement = await Settlement.deploy(await rwa.getAddress(), await usdc.getAddress(), await registry.getAddress());
  await settlement.waitForDeployment();

  const DemoVerifier = await ethers.getContractFactory("DemoVerifier");
  const demoVerifier = await DemoVerifier.deploy();
  await demoVerifier.waitForDeployment();

  const Confidential = await ethers.getContractFactory("ConfidentialSettlement");
  const confidential = await Confidential.deploy(await demoVerifier.getAddress());
  await confidential.waitForDeployment();

  console.log(JSON.stringify({
    MockUSDC: await usdc.getAddress(),
    MockRWA: await rwa.getAddress(),
    EligibilityRegistry: await registry.getAddress(),
    VeilSettlement: await settlement.getAddress(),
    DemoVerifier: await demoVerifier.getAddress(),
    ConfidentialSettlement: await confidential.getAddress()
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
