import { ethers } from 'hardhat';
import 'dotenv/config';

async function main() {
  const [owner] = await ethers.getSigners();
  const buyer = process.env.BUYER_ADDRESS;
  const seller = process.env.SELLER_ADDRESS;
  const usdcAddress = process.env.MOCK_USDC_ADDRESS;
  const rwaAddress = process.env.MOCK_RWA_ADDRESS;
  const registryAddress = process.env.ELIGIBILITY_REGISTRY_ADDRESS;
  if (!buyer || !seller || !usdcAddress || !rwaAddress || !registryAddress) {
    throw new Error('Set BUYER_ADDRESS, SELLER_ADDRESS, MOCK_USDC_ADDRESS, MOCK_RWA_ADDRESS and ELIGIBILITY_REGISTRY_ADDRESS');
  }

  const usdc = await ethers.getContractAt('MockUSDC', usdcAddress);
  const rwa = await ethers.getContractAt('MockRWA', rwaAddress);
  const registry = await ethers.getContractAt('EligibilityRegistry', registryAddress);

  const expiry = Math.floor(Date.now() / 1000) + 7 * 24 * 3600;
  await (await registry.connect(owner).setEligibility(buyer, true, 2, expiry)).wait();
  await (await registry.connect(owner).setEligibility(seller, true, 2, expiry)).wait();
  await (await usdc.connect(owner).mint(buyer, ethers.parseUnits('10000000', 6))).wait();
  await (await rwa.connect(owner).mint(seller, ethers.parseUnits('1000000', 18))).wait();

  console.log('Seed complete');
  console.log('Buyer', buyer, 'received 10,000,000 vUSDC');
  console.log('Seller', seller, 'received 1,000,000 vTBILL');
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
