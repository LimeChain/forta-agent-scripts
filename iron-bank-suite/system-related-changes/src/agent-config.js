module.exports = {
    comptrollerEventSigs: [
        "event NewCloseFactor(uint256 oldCloseFactorMantissa, uint256 newCloseFactorMantissa)",
        "event NewCollateralFactor(address cToken, uint256 oldCollateralFactorMantissa, uint256 newCollateralFactorMantissa)",
        "event NewLiquidationIncentive(uint256 oldLiquidationIncentiveMantissa, uint256 newLiquidationIncentiveMantissa)",
        "event NewPriceOracle(address oldPriceOracle, address newPriceOracle)",
        "event NewPauseGuardian(address oldPauseGuardian, address newPauseGuardian)",
        "event NewLiquidityMining(address oldLiquidityMining, address newLiquidityMining)",
        "event NewBorrowCap(address indexed cToken, uint256 newBorrowCap)",
        "event NewBorrowCapGuardian(address oldBorrowCapGuardian, address newBorrowCapGuardian)",
        "event NewSupplyCap(address indexed cToken, uint256 newSupplyCap)",
        "event NewSupplyCapGuardian(address oldSupplyCapGuardian, address newSupplyCapGuardian)",
        "event MarketListed(address cToken)",
        "event MarketDelisted(CToken cToken)"
    ],
    marketEventSigs: [
        "event NewPendingAdmin(address oldPendingAdmin, address newPendingAdmin)",
        "event NewAdmin(address oldAdmin, address newAdmin)",
        "event NewComptroller(address oldComptroller, address newComptroller)",
        "event NewMarketInterestRateModel(address oldInterestRateModel, address newInterestRateModel)",
        "event NewReserveFactor(uint256 oldReserveFactorMantissa, uint256 newReserveFactorMantissa)",
        "event NewImplementation(address oldImplementation, address newImplementation)"
    ]
}
