import { AppError } from "../../../utils/appError.js";
import * as manufacturerRepository from "../repositories/manufacturer.repository.js";

const toPublic = (doc) => doc.toJSON();

const buildListFilter = ({ search }) => {
  if (!search) return {};

  return { name: { $regex: search, $options: "i" } };
};

export const createManufacturer = async (payload) => {
  const existing = await manufacturerRepository.findManufacturerByName(
    payload.name,
  );

  if (existing) {
    throw new AppError(
      "Manufacturer name is already in use.",
      409,
      "NAME_IN_USE",
    );
  }

  const manufacturer = await manufacturerRepository.createManufacturer({
    name: payload.name,
    country: payload.country ?? "",
  });

  return toPublic(manufacturer);
};

export const listManufacturers = async ({ page, limit, search }) => {
  const filter = buildListFilter({ search });
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    manufacturerRepository.listManufacturers({ filter, skip, limit }),
    manufacturerRepository.countManufacturers(filter),
  ]);

  return { items: items.map(toPublic), page, limit, total };
};

export const getManufacturerById = async (id) => {
  const manufacturer = await manufacturerRepository.findManufacturerById(id);

  if (!manufacturer) {
    throw new AppError(
      "Manufacturer was not found.",
      404,
      "MANUFACTURER_NOT_FOUND",
    );
  }

  return toPublic(manufacturer);
};

export const updateManufacturer = async (id, payload) => {
  const current = await manufacturerRepository.findManufacturerById(id);

  if (!current) {
    throw new AppError(
      "Manufacturer was not found.",
      404,
      "MANUFACTURER_NOT_FOUND",
    );
  }

  if (payload.name) {
    const existing = await manufacturerRepository.findManufacturerByName(
      payload.name,
    );

    if (existing && String(existing._id) !== String(id)) {
      throw new AppError(
        "Manufacturer name is already in use.",
        409,
        "NAME_IN_USE",
      );
    }
  }

  const updated = await manufacturerRepository.updateManufacturerById(
    id,
    payload,
  );
  return toPublic(updated);
};

export const deactivateManufacturer = async (id) => {
  const manufacturer = await manufacturerRepository.findManufacturerById(id);

  if (!manufacturer) {
    throw new AppError(
      "Manufacturer was not found.",
      404,
      "MANUFACTURER_NOT_FOUND",
    );
  }

  if (!manufacturer.isActive) {
    return toPublic(manufacturer);
  }

  const updated = await manufacturerRepository.updateManufacturerById(id, {
    isActive: false,
  });

  return toPublic(updated);
};
