const { expect } = require("chai");
const { ethers } = require("hardhat");

const parseRwa = (v) => ethers.parseUnits(v, 18);
const parseUsd = (v) => ethers.parseUnits(v, 6);

describe("VeilSettlement", function () {
  it("settles both legs atomically after eligibility and approvals", async function () {
    const [owner, buyer, seller] = await ethers.getSigners();

    const USDC = await ethers.getContractFactory("MockUSDC");
    const usdc = await USDC.deploy(owner.address);
    const RWA = await ethers.getContractFactory("MockRWA");
    const rwa = await RWA.deploy(owner.address);
    const Registry = await ethers.getContractFactory("EligibilityRegistry");
    const registry = await Registry.deploy(owner.address);
    const Settlement = await ethers.getContractFactory("VeilSettlement");
    const settlement = await Settlement.deploy(await rwa.getAddress(), await usdc.getAddress(), await registry.getAddress());

    await registry.setEligibility(buyer.address, true, 2, 0);
    await registry.setEligibility(seller.address, true, 2, 0);
    await usdc.mint(buyer.address, parseUsd("10000"));
    await rwa.mint(seller.address, parseRwa("1000"));
    await usdc.connect(buyer).approve(await settlement.getAddress(), parseUsd("5000"));
    await rwa.connect(seller).approve(await settlement.getAddress(), parseRwa("500"));

    const id = ethers.keccak256(ethers.toUtf8Bytes("trade-1"));
    const commitment = ethers.keccak256(ethers.toUtf8Bytes("private-terms"));
    await settlement.connect(buyer).createTrade(
      id, buyer.address, seller.address, parseRwa("500"), parseUsd("5000"), commitment
    );
    await settlement.connect(buyer).approveTrade(id);
    await settlement.connect(seller).approveTrade(id);
    await settlement.settle(id);

    expect(await rwa.balanceOf(buyer.address)).to.equal(parseRwa("500"));
    expect(await usdc.balanceOf(seller.address)).to.equal(parseUsd("5000"));
  });

  it("blocks settlement if eligibility is revoked before execution", async function () {
    const [owner, buyer, seller] = await ethers.getSigners();
    const USDC = await ethers.getContractFactory("MockUSDC");
    const usdc = await USDC.deploy(owner.address);
    const RWA = await ethers.getContractFactory("MockRWA");
    const rwa = await RWA.deploy(owner.address);
    const Registry = await ethers.getContractFactory("EligibilityRegistry");
    const registry = await Registry.deploy(owner.address);
    const Settlement = await ethers.getContractFactory("VeilSettlement");
    const settlement = await Settlement.deploy(await rwa.getAddress(), await usdc.getAddress(), await registry.getAddress());

    await registry.setEligibility(buyer.address, true, 2, 0);
    await registry.setEligibility(seller.address, true, 2, 0);

    const id = ethers.keccak256(ethers.toUtf8Bytes("trade-2"));
    await settlement.connect(buyer).createTrade(id, buyer.address, seller.address, 1n, 1n, ethers.ZeroHash);
    await settlement.connect(buyer).approveTrade(id);
    await settlement.connect(seller).approveTrade(id);
    await registry.setEligibility(seller.address, false, 0, 0);

    await expect(settlement.settle(id)).to.be.revertedWith("eligibility changed");
  });
});
