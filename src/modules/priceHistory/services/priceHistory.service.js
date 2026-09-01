import mongoose from "mongoose";
import { AppError } from "../../../utils/appError.js";
import * as drugRepository from "../../drug/repositories/drug.repository.js";
import * as priceHistoryRepository from "../repositories/priceHistory.repository.js";

const toPublic = (doc) => doc.toJSON();

export const recordInitialPriceHistory = async (drug, actor, session) => {
  await priceHistoryRepository.createPriceHistory(
    {
      drugId: drug._id,
      previousPrice: 0,
      newPrice: drug.sellingPrice,
      changedBy: actor?._id ?? drug._id,
      effectiveAt: new Date(),
    },
    session,
  );
};

export const updateSellingPrice = async (actor, drugId, payload) => {
  const drug = await drugRepository.findDrugById(drugId);

  if (!drug || !drug.isActive) {
    throw new AppError("Drug was not found or is inactive.", 400, "INVALID_DRUG");
  }

  const previousPrice = drug.sellingPrice;
  const newPrice = payload.sellingPrice;

  if (previousPrice === newPrice) {
    throw new AppError("New price must be different from current price.", 400, "PRICE_UNCHANGED");
  }

  const session = await mongoose.startSession();

  try {
    let updated;

    await session.withTransaction(async () => {
      updated = await drugRepository.updateDrugById(
        drugId,
        { sellingPrice: newPrice },
        session,
      );

      await priceHistoryRepository.createPriceHistory(
        {
          drugId: drug._id,
          previousPrice,
          newPrice,
          changedBy: actor._id,
          effectiveAt: new Date(),
        },
        session,
      );
    });

    return toPublic(updated);
  } finally {
    await session.endSession();
  }
};

export const listPriceHistory = async (drugId, { page, limit }) => {
  const drug = await drugRepository.findDrugById(drugId);

  if (!drug) {
    throw new AppError("Drug was not found.", 404, "DRUG_NOT_FOUND");
  }

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    priceHistoryRepository.listPriceHistoryByDrug(drugId, { skip, limit }),
    priceHistoryRepository.countPriceHistoryByDrug(drugId),
  ]);

  return { items: items.map(toPublic), page, limit, total };
};
