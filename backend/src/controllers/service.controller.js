import {
  getAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
} from "../services/service.service.js";

export async function listServices(req, res, next) {
  try {
    const includeInactive = req.query.includeInactive === "true";
    const services = await getAllServices(includeInactive);

    return res.status(200).json({
      success: true,
      count: services.length,
      data: { services },
    });
  } catch (error) {
    next(error);
  }
}

export async function getService(req, res, next) {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid service ID",
      });
    }

    const service = await getServiceById(id);

    return res.status(200).json({
      success: true,
      data: { service },
    });
  } catch (error) {
    next(error);
  }
}

export async function create(req, res, next) {
  try {
    const service = await createService(req.body);
    return res.status(201).json({
      success: true,
      message: "Service created successfully",
      data: { service },
    });
  } catch (error) {
    next(error);
  }
}

export async function update(req, res, next) {
  try {
    const id = Number(req.params.id);
    const service = await updateService(id, req.body);
    return res.status(200).json({
      success: true,
      message: "Service updated successfully",
      data: { service },
    });
  } catch (error) {
    next(error);
  }
}

export async function remove(req, res, next) {
  try {
    const id = Number(req.params.id);
    const result = await deleteService(id);
    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
}
