import mongoose from "mongoose";
import { SHIPMENT_STATUSES } from "../../../constants/shipment.js";
import { LOCATION_TYPES, MOVEMENT_DIRECTIONS, MOVEMENT_TYPES } from "../../../constants/stockMovement.js";
import { SUPPLY_REQUEST_TYPES } from "../../../constants/supplyRequest.js";
import { ROLES } from "../../../constants/roles.js";
import { AppError } from "../../../utils/appError.js";
import { canAccessLocation } from "../../../utils/scope.js";
import * as batchRepository from "../../batch/repositories/batch.repository.js";
import { applyStockMovement } from "../../stockMovement/services/stockMovement.service.js";
import { assertApprovedSupplyRequest } from "../../supplyRequest/services/supplyRequest.service.js";
import * as shipmentRepository from "../repositories/shipment.repository.js";

const toPublic = (doc) => doc.toJSON();

const canAccessShipment = (actor, shipment) => {
  if (actor.role === ROLES.SYSTEM_ADMIN) {
    return true;
  }

  return (
    canAccessLocation(actor, shipment.sourceType, String(shipment.sourceId)) ||
    canAccessLocation(
      actor,
      shipment.destinationType,
      String(shipment.destinationId),
    )
  );
};

export const buildShipmentScopeFilter = (actor) => {
  if (actor.role === ROLES.SYSTEM_ADMIN) {
    return {};
  }

  const or = [];

  if (actor.pharmacyIds?.length) {
    const pharmacyScope = { $in: actor.pharmacyIds };

    or.push(
      { sourceType: LOCATION_TYPES.PHARMACY, sourceId: pharmacyScope },
      { destinationType: LOCATION_TYPES.PHARMACY, destinationId: pharmacyScope },
    );
  }

  if (actor.warehouseIds?.length) {
    const warehouseScope = { $in: actor.warehouseIds };

    or.push(
      { sourceType: LOCATION_TYPES.WAREHOUSE, sourceId: warehouseScope },
      {
        destinationType: LOCATION_TYPES.WAREHOUSE,
        destinationId: warehouseScope,
      },
    );
  }

  if (!or.length) {
    return { _id: null };
  }

  return { $or: or };
};

const getShipmentOrThrow = async (id) => {
  const shipment = await shipmentRepository.findShipmentById(id);

  if (!shipment) {
    throw new AppError("Shipment was not found.", 404, "SHIPMENT_NOT_FOUND");
  }

  return shipment;
};

const getApprovedItemMap = (supplyRequest) => {
  const map = new Map();

  for (const item of supplyRequest.items) {
    if (item.approvedQuantity > 0) {
      map.set(String(item.drugId), item.approvedQuantity);
    }
  }

  return map;
};

const getCommittedMap = async (supplyRequestId) => {
  const rows =
    await shipmentRepository.sumCommittedQuantitiesBySupplyRequest(supplyRequestId);

  return new Map(rows.map((row) => [String(row._id), row.totalCommitted]));
};

const assertBatchForDrug = async (drugId, batchId) => {
  const batch = await batchRepository.findBatchById(batchId);

  if (!batch || !batch.isActive) {
    throw new AppError("Batch was not found or is inactive.", 400, "INVALID_BATCH");
  }

  if (String(batch.drugId) !== String(drugId)) {
    throw new AppError("Batch does not belong to this drug.", 400, "BATCH_DRUG_MISMATCH");
  }
};

const getSendMovementType = (supplyRequest) => {
  if (supplyRequest.requestType === SUPPLY_REQUEST_TYPES.PHARMACY_TO_WAREHOUSE) {
    return MOVEMENT_TYPES.SUPPLY_TO_PHARMACY;
  }

  return MOVEMENT_TYPES.SUPPLY_TO_WAREHOUSE;
};

const getReceiveMovementType = (shipment) => {
  if (shipment.destinationType === LOCATION_TYPES.PHARMACY) {
    return MOVEMENT_TYPES.SUPPLY_RECEIVING;
  }

  return MOVEMENT_TYPES.SUPPLY_TO_WAREHOUSE;
};

export const createShipment = async (actor, payload) => {
  const supplyRequest = await assertApprovedSupplyRequest(payload.supplyRequestId);

  if (!canAccessLocation(actor, supplyRequest.sourceType, String(supplyRequest.sourceId))) {
    throw new AppError("You cannot create shipments from this source.", 403, "FORBIDDEN");
  }

  const approvedMap = getApprovedItemMap(supplyRequest);
  const committedMap = await getCommittedMap(String(supplyRequest._id));

  const newQtyByDrug = new Map();

  for (const item of payload.items) {
    const drugKey = String(item.drugId);

    if (!approvedMap.has(drugKey)) {
      throw new AppError(
        "Drug is not approved on this supply request.",
        400,
        "DRUG_NOT_APPROVED",
      );
    }

    await assertBatchForDrug(item.drugId, item.batchId);
    newQtyByDrug.set(drugKey, (newQtyByDrug.get(drugKey) ?? 0) + item.sentQuantity);
  }

  for (const [drugId, newQty] of newQtyByDrug) {
    const approved = approvedMap.get(drugId);
    const committed = committedMap.get(drugId) ?? 0;

    if (committed + newQty > approved) {
      throw new AppError(
        "Sent quantity exceeds remaining approved quantity for a drug.",
        400,
        "EXCEEDS_APPROVED_QUANTITY",
      );
    }
  }

  const shipment = await shipmentRepository.createShipment({
    supplyRequestId: supplyRequest._id,
    status: SHIPMENT_STATUSES.PREPARED,
    sourceType: supplyRequest.sourceType,
    sourceId: supplyRequest.sourceId,
    destinationType: supplyRequest.destinationType,
    destinationId: supplyRequest.destinationId,
    items: payload.items.map((item) => ({
      drugId: item.drugId,
      batchId: item.batchId,
      sentQuantity: item.sentQuantity,
      receivedQuantity: 0,
      shortageQuantity: 0,
    })),
    createdBy: actor._id,
  });

  return toPublic(shipment);
};

export const listShipments = async (
  actor,
  { page, limit, status, supplyRequestId },
) => {
  const filter = { ...buildShipmentScopeFilter(actor) };

  if (status) {
    filter.status = status;
  }

  if (supplyRequestId) {
    filter.supplyRequestId = supplyRequestId;
  }

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    shipmentRepository.listShipments({ filter, skip, limit }),
    shipmentRepository.countShipments(filter),
  ]);

  return { items: items.map(toPublic), page, limit, total };
};

export const getShipmentById = async (actor, id) => {
  const shipment = await getShipmentOrThrow(id);

  if (!canAccessShipment(actor, shipment)) {
    throw new AppError("You cannot access this shipment.", 403, "FORBIDDEN");
  }

  return toPublic(shipment);
};

export const sendShipment = async (actor, id) => {
  const shipment = await getShipmentOrThrow(id);

  if (!canAccessLocation(actor, shipment.sourceType, String(shipment.sourceId))) {
    throw new AppError("You cannot send this shipment.", 403, "FORBIDDEN");
  }

  if (shipment.status !== SHIPMENT_STATUSES.PREPARED) {
    throw new AppError("Only prepared shipments can be sent.", 400, "INVALID_STATUS");
  }

  const supplyRequest = await assertApprovedSupplyRequest(
    String(shipment.supplyRequestId),
  );
  const movementType = getSendMovementType(supplyRequest);
  const reference = `shipment:${String(shipment._id)}`;
  const session = await mongoose.startSession();

  try {
    let updated;

    await session.withTransaction(async () => {
      for (const item of shipment.items) {
        await applyStockMovement(
          {
            movementType,
            direction: MOVEMENT_DIRECTIONS.OUT,
            drugId: String(item.drugId),
            batchId: String(item.batchId),
            quantity: item.sentQuantity,
            locationType: shipment.sourceType,
            locationId: String(shipment.sourceId),
            counterpartyLocationType: shipment.destinationType,
            counterpartyLocationId: String(shipment.destinationId),
            reference,
          },
          actor,
          session,
        );
      }

      updated = await shipmentRepository.updateShipmentById(
        id,
        {
          status: SHIPMENT_STATUSES.SENT,
          sentBy: actor._id,
          sentAt: new Date(),
        },
        session,
      );
    });

    return toPublic(updated);
  } finally {
    await session.endSession();
  }
};

export const receiveShipment = async (actor, id, payload) => {
  const shipment = await getShipmentOrThrow(id);

  if (
    !canAccessLocation(
      actor,
      shipment.destinationType,
      String(shipment.destinationId),
    )
  ) {
    throw new AppError("You cannot receive this shipment.", 403, "FORBIDDEN");
  }

  if (
    shipment.status !== SHIPMENT_STATUSES.SENT &&
    shipment.status !== SHIPMENT_STATUSES.PARTIALLY_RECEIVED
  ) {
    throw new AppError(
      "Only sent or partially received shipments can be received.",
      400,
      "INVALID_STATUS",
    );
  }

  const shipmentItemMap = new Map(
    shipment.items.map((item) => [
      `${String(item.drugId)}:${String(item.batchId)}`,
      item,
    ]),
  );

  const receiveMap = new Map(
    payload.items.map((item) => [
      `${String(item.drugId)}:${String(item.batchId)}`,
      item.receivedQuantity,
    ]),
  );

  if (receiveMap.size !== shipmentItemMap.size) {
    throw new AppError(
      "Received items must match all shipment items.",
      400,
      "ITEM_MISMATCH",
    );
  }

  const updatedItems = shipment.items.map((item) => {
    const key = `${String(item.drugId)}:${String(item.batchId)}`;
    const receivedQuantity = receiveMap.get(key);

    if (receivedQuantity === undefined) {
      throw new AppError("Missing received quantity for a shipment item.", 400, "ITEM_MISMATCH");
    }

    if (receivedQuantity > item.sentQuantity) {
      throw new AppError(
        "Received quantity cannot exceed sent quantity.",
        400,
        "INVALID_RECEIVED_QUANTITY",
      );
    }

    return {
      drugId: item.drugId,
      batchId: item.batchId,
      sentQuantity: item.sentQuantity,
      receivedQuantity,
      shortageQuantity: item.sentQuantity - receivedQuantity,
    };
  });

  const movementType = getReceiveMovementType(shipment);
  const reference = `shipment:${String(shipment._id)}`;
  const session = await mongoose.startSession();

  try {
    let updated;

    await session.withTransaction(async () => {
      for (const item of updatedItems) {
        if (item.receivedQuantity <= 0) {
          continue;
        }

        await applyStockMovement(
          {
            movementType,
            direction: MOVEMENT_DIRECTIONS.IN,
            drugId: String(item.drugId),
            batchId: String(item.batchId),
            quantity: item.receivedQuantity,
            locationType: shipment.destinationType,
            locationId: String(shipment.destinationId),
            counterpartyLocationType: shipment.sourceType,
            counterpartyLocationId: String(shipment.sourceId),
            reference,
          },
          actor,
          session,
        );
      }

      const fullyReceived = updatedItems.every(
        (item) => item.receivedQuantity === item.sentQuantity,
      );

      updated = await shipmentRepository.updateShipmentById(
        id,
        {
          status: fullyReceived
            ? SHIPMENT_STATUSES.RECEIVED
            : SHIPMENT_STATUSES.PARTIALLY_RECEIVED,
          items: updatedItems,
          receivedBy: actor._id,
          receivedAt: new Date(),
        },
        session,
      );
    });

    return toPublic(updated);
  } finally {
    await session.endSession();
  }
};
